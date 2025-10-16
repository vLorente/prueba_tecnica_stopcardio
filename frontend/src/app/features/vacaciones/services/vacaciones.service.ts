import { Injectable, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import type {
  Vacacion,
  VacacionApi,
  VacacionCreate,
  VacacionBalance,
  VacacionBalanceApi,
  VacacionListResponseApi,
  VacacionQueryParams
} from '@core/models/vacaciones.model';
import {
  mapVacacionApiToVacacion,
  mapVacacionCreateToApi,
  mapVacacionBalanceApiToVacacionBalance,
  mapVacacionListResponseApiToVacacionListResponse
} from '@/app/core/mappers/vacaciones.mapper';

/**
 * Servicio de Vacaciones
 *
 * Gestiona las solicitudes de vacaciones de los empleados usando signals.
 * Proporciona métodos para crear, listar y consultar el balance de días.
 */
@Injectable({
  providedIn: 'root'
})
export class VacacionesService {
  private apiService = inject(ApiService);

  // Signals privados (estado interno)
  private vacacionesSignal = signal<Vacacion[]>([]);
  private balanceSignal = signal<VacacionBalance | null>(null);
  private loadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  // Paginación
  private currentPageSignal = signal(1);
  private pageSizeSignal = signal(10);
  private totalSignal = signal(0);

  // Signals públicos readonly (computed)
  readonly vacaciones = computed(() => this.vacacionesSignal());
  readonly balance = computed(() => this.balanceSignal());
  readonly loading = computed(() => this.loadingSignal());
  readonly error = computed(() => this.errorSignal());
  readonly currentPage = computed(() => this.currentPageSignal());
  readonly pageSize = computed(() => this.pageSizeSignal());
  readonly total = computed(() => this.totalSignal());

  readonly totalPages = computed(() => {
    const total = this.totalSignal();
    const size = this.pageSizeSignal();
    return size > 0 ? Math.ceil(total / size) : 0;
  });

  readonly hasVacaciones = computed(() => this.vacacionesSignal().length > 0);

  /**
   * Crea una nueva solicitud de vacaciones
   */
  async createVacacion(data: VacacionCreate): Promise<Vacacion> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const apiData = mapVacacionCreateToApi(data);
      const response = await firstValueFrom(
        this.apiService.post<VacacionApi>('/vacaciones', apiData)
      );

      const vacacion = mapVacacionApiToVacacion(response);

      // Recargar la lista y el balance
      await Promise.all([
        this.loadVacaciones(),
        this.loadBalance()
      ]);

      return vacacion;
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al crear solicitud de vacaciones';
      this.errorSignal.set(errorMessage);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Carga el listado de vacaciones del usuario actual
   */
  async loadVacaciones(params: VacacionQueryParams = {}): Promise<void> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const queryParams: any = {
        skip: params.skip ?? (this.currentPageSignal() - 1) * this.pageSizeSignal(),
        limit: params.limit ?? this.pageSizeSignal()
      };

      if (params.status) {
        queryParams.status = params.status;
      }

      if (params.tipo) {
        queryParams.tipo = params.tipo;
      }

      if (params.fecha_desde) {
        queryParams.fecha_desde = params.fecha_desde;
      }

      if (params.fecha_hasta) {
        queryParams.fecha_hasta = params.fecha_hasta;
      }

      if (params.activas_only !== undefined) {
        queryParams.activas_only = params.activas_only;
      }

      const response = await firstValueFrom(
        this.apiService.get<VacacionListResponseApi>('/vacaciones/me', queryParams)
      );

      const vacacionList = mapVacacionListResponseApiToVacacionListResponse(response);

      this.vacacionesSignal.set(vacacionList.solicitudes);
      this.totalSignal.set(vacacionList.total);
      // Calculamos page y pageSize basándonos en skip/limit
      const currentPage = Math.floor(vacacionList.skip / vacacionList.limit) + 1;
      this.currentPageSignal.set(currentPage);
      this.pageSizeSignal.set(vacacionList.limit);
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al cargar vacaciones';
      this.errorSignal.set(errorMessage);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Carga el balance de días de vacaciones
   */
  async loadBalance(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.apiService.get<VacacionBalanceApi>('/vacaciones/me/balance')
      );

      const balance = mapVacacionBalanceApiToVacacionBalance(response);
      this.balanceSignal.set(balance);
    } catch (error: any) {
      // El balance es opcional, no marcamos error general
      console.error('Error al cargar balance:', error);
      this.balanceSignal.set(null);
    }
  }

  /**
   * Navega a una página específica
   */
  async goToPage(page: number): Promise<void> {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.currentPageSignal.set(page);
    const skip = (page - 1) * this.pageSizeSignal();
    await this.loadVacaciones({ skip, limit: this.pageSizeSignal() });
  }

  /**
   * Limpia el error actual
   */
  clearError(): void {
    this.errorSignal.set(null);
  }
}
