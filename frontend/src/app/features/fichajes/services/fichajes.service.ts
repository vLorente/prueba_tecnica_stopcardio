import { Injectable, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import type {
  Fichaje,
  FichajeApi,
  FichajeCheckIn,
  FichajeCheckOut,
  FichajeCorrection,
  FichajeApproval,
  FichajeListResponse,
  FichajeListResponseApi,
  FichajeStats,
  FichajeStatsApi,
  FichajeQueryParams
} from '@core/models/fichaje.model';
import {
  mapFichajeApiToFichaje,
  mapFichajeCheckInToApi,
  mapFichajeCheckOutToApi,
  mapFichajeCorrectionToApi,
  mapFichajeApprovalToApi,
  mapFichajeListResponseApiToFichajeListResponse,
  mapFichajeStatsApiToFichajeStats
} from '@core/mappers/fichaje.mapper';

/**
 * Fichajes Service
 * Gestiona el estado y operaciones de fichajes con signals
 */
@Injectable({
  providedIn: 'root'
})
export class FichajesService {
  private apiService = inject(ApiService);

  // Private signals
  private fichajesSignal = signal<Fichaje[]>([]);
  private fichajeActivoSignal = signal<Fichaje | null>(null);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  private totalSignal = signal<number>(0);
  private totalHoursSignal = signal<number>(0);
  private currentPageSignal = signal<number>(1);
  private pageSizeSignal = signal<number>(10);

  // Public getters
  get fichajes() {
    return this.fichajesSignal.asReadonly();
  }

  get fichajeActivo() {
    return this.fichajeActivoSignal.asReadonly();
  }

  get loading() {
    return this.loadingSignal.asReadonly();
  }

  get error() {
    return this.errorSignal.asReadonly();
  }

  get total() {
    return this.totalSignal.asReadonly();
  }

  get totalHours() {
    return this.totalHoursSignal.asReadonly();
  }

  get currentPage() {
    return this.currentPageSignal.asReadonly();
  }

  get pageSize() {
    return this.pageSizeSignal.asReadonly();
  }

  // Computed signals
  readonly totalPages = computed(() => {
    const total = this.totalSignal();
    const size = this.pageSizeSignal();
    return size > 0 ? Math.ceil(total / size) : 0;
  });

  readonly hasFichajeActivo = computed(() => this.fichajeActivoSignal() !== null);

  readonly ultimoFichaje = computed(() => {
    const fichajes = this.fichajesSignal();
    return fichajes.length > 0 ? fichajes[0] : null;
  });

  /**
   * Registra un check-in (entrada)
   */
  async checkIn(data: FichajeCheckIn = {}): Promise<Fichaje> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const apiData = mapFichajeCheckInToApi(data);
      const response = await firstValueFrom(
        this.apiService.post<FichajeApi>('/fichajes/check-in', apiData)
      );

      const fichaje = mapFichajeApiToFichaje(response);
      this.fichajeActivoSignal.set(fichaje);

      // Recargar el historial
      await this.loadFichajes();

      return fichaje;
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al registrar entrada';
      this.errorSignal.set(errorMessage);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Registra un check-out (salida)
   */
  async checkOut(data: FichajeCheckOut = {}): Promise<Fichaje> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const apiData = mapFichajeCheckOutToApi(data);
      const response = await firstValueFrom(
        this.apiService.post<FichajeApi>('/fichajes/check-out', apiData)
      );

      const fichaje = mapFichajeApiToFichaje(response);
      this.fichajeActivoSignal.set(null);

      // Recargar el historial
      await this.loadFichajes();

      return fichaje;
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al registrar salida';
      this.errorSignal.set(errorMessage);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Obtiene el fichaje activo del usuario actual
   */
  async loadFichajeActivo(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.apiService.get<FichajeApi>('/fichajes/me/active')
      );

      if (response) {
        const fichaje = mapFichajeApiToFichaje(response);
        this.fichajeActivoSignal.set(fichaje);
      } else {
        this.fichajeActivoSignal.set(null);
      }
    } catch (error: any) {
      // Si no hay fichaje activo, la API puede devolver 404
      // En ese caso, simplemente establecemos null
      this.fichajeActivoSignal.set(null);
    }
  }

  /**
   * Carga el historial de fichajes del usuario actual
   */
  async loadFichajes(params: FichajeQueryParams = {}): Promise<void> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const queryParams: any = {
        skip: params.skip ?? (this.currentPageSignal() - 1) * this.pageSizeSignal(),
        limit: params.limit ?? this.pageSizeSignal()
      };

      if (params.dateFrom) {
        queryParams.date_from = params.dateFrom;
      }

      if (params.dateTo) {
        queryParams.date_to = params.dateTo;
      }

      const response = await firstValueFrom(
        this.apiService.get<FichajeListResponseApi>('/fichajes/me', queryParams)
      );

      const fichajeList = mapFichajeListResponseApiToFichajeListResponse(response);

      this.fichajesSignal.set(fichajeList.fichajes);
      this.totalSignal.set(fichajeList.total);
      this.totalHoursSignal.set(fichajeList.totalHours);
      this.currentPageSignal.set(fichajeList.page);
      this.pageSizeSignal.set(fichajeList.pageSize);
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al cargar el historial de fichajes';
      this.errorSignal.set(errorMessage);
      throw error;
    } finally {
      this.loadingSignal.set(false);
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
    await this.loadFichajes({ skip, limit: this.pageSizeSignal() });
  }

  /**
   * Obtiene estadísticas de fichajes
   */
  async loadStats(params: { dateFrom?: string; dateTo?: string } = {}): Promise<FichajeStats> {
    try {
      const queryParams: any = {};

      if (params.dateFrom) {
        queryParams.date_from = params.dateFrom;
      }

      if (params.dateTo) {
        queryParams.date_to = params.dateTo;
      }

      const response = await firstValueFrom(
        this.apiService.get<FichajeStatsApi>('/fichajes/me/stats', queryParams)
      );

      return mapFichajeStatsApiToFichajeStats(response);
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al cargar estadísticas';
      this.errorSignal.set(errorMessage);
      throw error;
    }
  }

  /**
   * Solicita una corrección para un fichaje
   */
  async solicitarCorreccion(fichajeId: number, correccion: FichajeCorrection): Promise<Fichaje> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const apiData = mapFichajeCorrectionToApi(correccion);
      const response = await firstValueFrom(
        this.apiService.post<FichajeApi>(`/fichajes/${fichajeId}/correct`, apiData)
      );

      const fichaje = mapFichajeApiToFichaje(response);

      // Recargar el historial
      await this.loadFichajes();

      return fichaje;
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al solicitar corrección';
      this.errorSignal.set(errorMessage);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Aprueba una solicitud de corrección de fichaje
   */
  async aprobarCorreccion(fichajeId: number, notes?: string): Promise<Fichaje> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const approval: FichajeApproval = {
        approved: true,
        approvalNotes: notes
      };

      const apiData = mapFichajeApprovalToApi(approval);
      const response = await firstValueFrom(
        this.apiService.post<FichajeApi>(`/fichajes/${fichajeId}/approve`, apiData)
      );

      const fichaje = mapFichajeApiToFichaje(response);

      // Recargar el historial
      await this.loadFichajes();

      return fichaje;
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al aprobar corrección';
      this.errorSignal.set(errorMessage);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Rechaza una solicitud de corrección de fichaje
   */
  async rechazarCorreccion(fichajeId: number, notes?: string): Promise<Fichaje> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const approval: FichajeApproval = {
        approved: false,
        approvalNotes: notes
      };

      const apiData = mapFichajeApprovalToApi(approval);
      const response = await firstValueFrom(
        this.apiService.post<FichajeApi>(`/fichajes/${fichajeId}/approve`, apiData)
      );

      const fichaje = mapFichajeApiToFichaje(response);

      // Recargar el historial
      await this.loadFichajes();

      return fichaje;
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al rechazar corrección';
      this.errorSignal.set(errorMessage);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Limpia el error actual
   */
  clearError(): void {
    this.errorSignal.set(null);
  }
}
