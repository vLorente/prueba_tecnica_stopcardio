/**
 * Fichaje Models
 * Modelos para el sistema de fichajes (check-in/check-out)
 */

/**
 * Estados posibles de un fichaje
 */
export type FichajeStatus = 'valid' | 'pending_correction' | 'corrected' | 'rejected';

/**
 * Modelo de fichaje (Frontend)
 *
 * Nota: Las fechas se convierten a Date objects para mejor type safety.
 * El backend envía las fechas en formato ISO con timezone 'Z' (UTC).
 */
export interface Fichaje {
  id: number;
  userId: number;
  userEmail: string;
  userFullName: string;
  checkIn: Date;
  checkOut: Date | null;
  hoursWorked: number | null;
  status: FichajeStatus;
  notes: string | null;
  correctionReason: string | null;
  correctionRequestedAt: Date | null;
  approvedBy: number | null;
  approvedAt: Date | null;
  approvalNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Modelo API Response (snake_case)
 * Representa un fichaje en la respuesta de la API
 */
export interface FichajeApi {
  id: number;
  user_id: number;
  user_email: string;
  user_full_name: string;
  check_in: string;
  check_out: string | null;
  hours_worked: number | null;
  status: FichajeStatus;
  notes: string | null;
  correction_reason: string | null;
  correction_requested_at: string | null;
  approved_by: number | null;
  approved_at: string | null;
  approval_notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Request para registrar entrada (check-in)
 */
export interface FichajeCheckIn {
  notes?: string;
}

/**
 * Request API para registrar entrada (snake_case)
 */
export interface FichajeCheckInApi {
  notes?: string;
}

/**
 * Request para registrar salida (check-out)
 */
export interface FichajeCheckOut {
  notes?: string;
}

/**
 * Request API para registrar salida (snake_case)
 */
export interface FichajeCheckOutApi {
  notes?: string;
}

/**
 * Respuesta paginada de fichajes (Frontend)
 */
export interface FichajeListResponse {
  fichajes: Fichaje[];
  total: number;
  page: number;
  pageSize: number;
  totalHours: number;
}

/**
 * Respuesta paginada de fichajes (API)
 */
export interface FichajeListResponseApi {
  fichajes: FichajeApi[];
  total: number;
  page: number;
  page_size: number;
  total_hours: number;
}

/**
 * Estadísticas de fichajes (Frontend)
 */
export interface FichajeStats {
  totalFichajes: number;
  fichajesCompletos: number;
  fichajesIncompletos: number;
  pendingCorrections: number;
  totalHours: number;
  averageHoursPerDay: number;
}

/**
 * Estadísticas de fichajes (API)
 */
export interface FichajeStatsApi {
  total_fichajes: number;
  fichajes_completos: number;
  fichajes_incompletos: number;
  pending_corrections: number;
  total_hours: number;
  average_hours_per_day: number;
}

/**
 * Parámetros de consulta para obtener fichajes
 */
export interface FichajeQueryParams {
  skip?: number;
  limit?: number;
  dateFrom?: string; // formato: YYYY-MM-DD
  dateTo?: string; // formato: YYYY-MM-DD
}
