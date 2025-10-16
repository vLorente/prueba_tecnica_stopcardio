/**
 * Fichaje Mappers
 * Funciones para convertir entre modelos de API (snake_case) y Frontend (camelCase)
 */

import type {
  Fichaje,
  FichajeApi,
  FichajeCheckIn,
  FichajeCheckInApi,
  FichajeCheckOut,
  FichajeCheckOutApi,
  FichajeCorrection,
  FichajeCorrectionApi,
  FichajeApproval,
  FichajeApprovalApi,
  FichajeListResponse,
  FichajeListResponseApi,
  FichajeStats,
  FichajeStatsApi
} from '@core/models/fichaje.model';

/**
 * Convierte un fichaje de API (snake_case) a Frontend (camelCase)
 *
 * Nota: Las fechas se convierten de string ISO a Date objects.
 * El backend envía las fechas en formato ISO con timezone 'Z' (UTC).
 */
export function mapFichajeApiToFichaje(api: FichajeApi): Fichaje {
  return {
    id: api.id,
    userId: api.user_id,
    userEmail: api.user_email,
    userFullName: api.user_full_name,
    checkIn: new Date(api.check_in),
    checkOut: api.check_out ? new Date(api.check_out) : null,
    hoursWorked: api.hours_worked,
    status: api.status,
    notes: api.notes,
    correctionReason: api.correction_reason,
    correctionRequestedAt: api.correction_requested_at ? new Date(api.correction_requested_at) : null,
    approvedBy: api.approved_by,
    approvedAt: api.approved_at ? new Date(api.approved_at) : null,
    approvalNotes: api.approval_notes,
    createdAt: new Date(api.created_at),
    updatedAt: new Date(api.updated_at)
  };
}

/**
 * Convierte un request de check-in de Frontend a API
 */
export function mapFichajeCheckInToApi(checkIn: FichajeCheckIn): FichajeCheckInApi {
  return {
    notes: checkIn.notes
  };
}

/**
 * Convierte un request de check-out de Frontend a API
 */
export function mapFichajeCheckOutToApi(checkOut: FichajeCheckOut): FichajeCheckOutApi {
  return {
    notes: checkOut.notes
  };
}

/**
 * Convierte un request de corrección de Frontend a API
 */
export function mapFichajeCorrectionToApi(correction: FichajeCorrection): FichajeCorrectionApi {
  return {
    check_in: correction.checkIn.toISOString(),
    check_out: correction.checkOut ? correction.checkOut.toISOString() : undefined,
    correction_reason: correction.correctionReason
  };
}

/**
 * Convierte un request de aprobación de Frontend a API
 */
export function mapFichajeApprovalToApi(approval: FichajeApproval): FichajeApprovalApi {
  return {
    approved: approval.approved,
    approval_notes: approval.approvalNotes
  };
}

/**
 * Convierte una respuesta paginada de fichajes de API a Frontend
 */
export function mapFichajeListResponseApiToFichajeListResponse(
  api: FichajeListResponseApi
): FichajeListResponse {
  return {
    fichajes: api.fichajes.map(mapFichajeApiToFichaje),
    total: api.total,
    page: api.page,
    pageSize: api.page_size,
    totalHours: api.total_hours
  };
}

/**
 * Convierte estadísticas de fichajes de API a Frontend
 */
export function mapFichajeStatsApiToFichajeStats(api: FichajeStatsApi): FichajeStats {
  return {
    totalFichajes: api.total_fichajes,
    fichajesCompletos: api.fichajes_completos,
    fichajesIncompletos: api.fichajes_incompletos,
    pendingCorrections: api.pending_corrections,
    totalHours: api.total_hours,
    averageHoursPerDay: api.average_hours_per_day
  };
}
