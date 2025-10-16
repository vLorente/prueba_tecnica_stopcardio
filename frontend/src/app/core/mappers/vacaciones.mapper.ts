/**
 * Mappers para Vacaciones
 *
 * Funciones para convertir entre formatos API (snake_case) y Frontend (camelCase)
 * Alineado con SolicitudResponse y SolicitudCreate del OpenAPI
 */

import type {
  Vacacion,
  VacacionApi,
  VacacionCreate,
  VacacionCreateApi,
  VacacionBalance,
  VacacionBalanceApi,
  VacacionListResponse,
  VacacionListResponseApi,
  VacacionReview,
  VacacionReviewApi
} from '../models/vacaciones.model';

/**
 * Convierte una solicitud de API (SolicitudResponse) a formato Frontend
 * Las fechas ISO se convierten a Date objects
 */
export const mapVacacionApiToVacacion = (api: VacacionApi): Vacacion => ({
  id: api.id,
  userId: api.user_id,
  userEmail: api.user_email,
  userFullName: api.user_full_name,
  tipo: api.tipo,
  fechaInicio: new Date(api.fecha_inicio + 'T00:00:00Z'),  // ISO date a UTC Date
  fechaFin: new Date(api.fecha_fin + 'T00:00:00Z'),        // ISO date a UTC Date
  diasSolicitados: api.dias_solicitados,
  motivo: api.motivo,
  status: api.status,
  reviewedBy: api.reviewed_by,
  reviewedByName: api.reviewed_by_name,
  reviewedAt: api.reviewed_at ? new Date(api.reviewed_at) : null,
  comentariosRevision: api.comentarios_revision,
  isPending: api.is_pending,
  isApproved: api.is_approved,
  isActive: api.is_active,
  createdAt: new Date(api.created_at),
  updatedAt: new Date(api.updated_at)
});

/**
 * Convierte datos de creación de Frontend a formato API (SolicitudCreate)
 * Las fechas se convierten a formato ISO date (YYYY-MM-DD)
 */
export const mapVacacionCreateToApi = (data: VacacionCreate): VacacionCreateApi => ({
  tipo: data.tipo,
  fecha_inicio: data.fechaInicio.toISOString().split('T')[0],  // Date a YYYY-MM-DD
  fecha_fin: data.fechaFin.toISOString().split('T')[0],        // Date a YYYY-MM-DD
  motivo: data.motivo
});

/**
 * Convierte balance de días de API (VacationBalance) a formato Frontend
 */
export const mapVacacionBalanceApiToVacacionBalance = (api: VacacionBalanceApi): VacacionBalance => ({
  userId: api.user_id,
  userEmail: api.user_email,
  userFullName: api.user_full_name,
  diasAnuales: api.dias_anuales,
  diasDisponibles: api.dias_disponibles,
  diasTomados: api.dias_tomados,
  diasPendientes: api.dias_pendientes,
  solicitudesPendientes: api.solicitudes_pendientes,
  solicitudesAprobadas: api.solicitudes_aprobadas,
  proximoPeriodo: api.proximo_periodo ? new Date(api.proximo_periodo + 'T00:00:00Z') : null
});

/**
 * Convierte respuesta paginada de API (SolicitudListResponse) a formato Frontend
 */
export const mapVacacionListResponseApiToVacacionListResponse = (
  api: VacacionListResponseApi
): VacacionListResponse => ({
  solicitudes: api.solicitudes.map(mapVacacionApiToVacacion),
  total: api.total,
  skip: api.skip,
  limit: api.limit
});

/**
 * Convierte datos de revisión (aprobar/rechazar) de Frontend a formato API (SolicitudReview)
 * Solo para usuarios HR
 */
export const mapVacacionReviewToApi = (review: VacacionReview): VacacionReviewApi => ({
  approved: review.approved,
  comentarios_revision: review.comentariosRevision
});
