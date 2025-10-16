/**
 * Modelos de Vacaciones
 *
 * Define las interfaces para el manejo de solicitudes de vacaciones
 * y ausencias de los empleados.
 */

/**
 * Tipo de ausencia/vacación
 */
export type VacacionTipo = 'vacation' | 'sick_leave' | 'personal' | 'other';

/**
 * Estado de la solicitud
 */
export type VacacionEstado = 'pending' | 'approved' | 'rejected' | 'cancelled';

/**
 * Modelo de Vacación para el frontend (camelCase)
 * Mapeado desde SolicitudResponse del API
 */
export interface Vacacion {
  id: number;
  userId: number;
  userEmail: string;
  userFullName: string;
  tipo: VacacionTipo;
  fechaInicio: Date;
  fechaFin: Date;
  diasSolicitados: number;
  motivo: string;
  status: VacacionEstado;
  reviewedBy: number | null;
  reviewedByName: string | null;
  reviewedAt: Date | null;
  comentariosRevision: string | null;
  isPending: boolean;
  isApproved: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Modelo de Vacación desde la API (snake_case)
 * Corresponde a SolicitudResponse en el OpenAPI
 */
export interface VacacionApi {
  id: number;
  user_id: number;
  user_email: string;
  user_full_name: string;
  tipo: VacacionTipo;
  fecha_inicio: string;  // ISO date (YYYY-MM-DD)
  fecha_fin: string;     // ISO date (YYYY-MM-DD)
  dias_solicitados: number;
  motivo: string;
  status: VacacionEstado;
  reviewed_by: number | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;  // ISO 8601 datetime
  comentarios_revision: string | null;
  is_pending: boolean;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;  // ISO 8601 datetime
  updated_at: string;  // ISO 8601 datetime
}

/**
 * Datos para crear una solicitud de vacaciones (frontend)
 * Corresponde a SolicitudCreate en el OpenAPI
 */
export interface VacacionCreate {
  tipo: VacacionTipo;
  fechaInicio: Date;
  fechaFin: Date;
  motivo: string;  // REQUERIDO: mínimo 10 caracteres, máximo 1000
}

/**
 * Datos para crear una solicitud de vacaciones (API)
 * Corresponde a SolicitudCreate en el OpenAPI
 */
export interface VacacionCreateApi {
  tipo: VacacionTipo;
  fecha_inicio: string;  // ISO date (YYYY-MM-DD)
  fecha_fin: string;     // ISO date (YYYY-MM-DD)
  motivo: string;        // Requerido: min 10, max 1000 caracteres
}

/**
 * Balance de días de vacaciones
 */
export interface VacacionBalance {
  userId: number;
  userEmail: string;
  userFullName: string;
  diasAnuales: number;           // Total de días asignados por año
  diasDisponibles: number;       // Días disponibles para usar
  diasTomados: number;           // Días ya tomados (aprobados)
  diasPendientes: number;        // Días en solicitudes pendientes
  solicitudesPendientes: number; // Número de solicitudes pendientes
  solicitudesAprobadas: number;  // Número de solicitudes aprobadas
  proximoPeriodo: Date | null;   // Fecha del próximo periodo
}

/**
 * Balance de días de vacaciones desde la API
 */
export interface VacacionBalanceApi {
  user_id: number;
  user_email: string;
  user_full_name: string;
  dias_anuales: number;
  dias_disponibles: number;
  dias_tomados: number;
  dias_pendientes: number;
  solicitudes_pendientes: number;
  solicitudes_aprobadas: number;
  proximo_periodo: string | null;
}

/**
 * Parámetros de consulta para filtrar vacaciones
 * Corresponde a los query params de /api/vacaciones/me
 */
export interface VacacionQueryParams {
  tipo?: string;           // Filtrar por tipo
  status?: string;         // Filtrar por estado
  fecha_desde?: string;    // Fecha inicio del rango (YYYY-MM-DD)
  fecha_hasta?: string;    // Fecha fin del rango (YYYY-MM-DD)
  activas_only?: boolean;  // Solo solicitudes actualmente en curso
  skip?: number;           // Registros a saltar (paginación)
  limit?: number;          // Máximo de registros a retornar
}

/**
 * Respuesta paginada de vacaciones (frontend)
 * Mapeado desde SolicitudListResponse del API
 */
export interface VacacionListResponse {
  solicitudes: Vacacion[];
  total: number;
  skip: number;
  limit: number;
}

/**
 * Respuesta paginada de vacaciones desde la API
 * Corresponde a SolicitudListResponse en el OpenAPI
 */
export interface VacacionListResponseApi {
  solicitudes: VacacionApi[];
  total: number;
  skip: number;
  limit: number;
}

/**
 * Datos para revisar (aprobar/rechazar) una solicitud (frontend)
 * Solo para usuarios HR
 * Corresponde a SolicitudReview en el OpenAPI
 */
export interface VacacionReview {
  approved: boolean;  // true = aprobar, false = rechazar
  comentariosRevision: string | null;
}

/**
 * Datos para revisar (aprobar/rechazar) una solicitud (API)
 * Corresponde a SolicitudReview en el OpenAPI
 */
export interface VacacionReviewApi {
  approved: boolean;
  comentarios_revision: string | null;  // máximo 500 caracteres
}

/**
 * Parámetros de consulta para listar todas las solicitudes (HR)
 * Corresponde a los query params de /api/vacaciones
 */
export interface VacacionAllQueryParams {
  user_id?: number;        // Filtrar por ID de usuario
  tipo?: string;           // Filtrar por tipo
  status?: string;         // Filtrar por estado
  fecha_desde?: string;    // Fecha inicio del rango (YYYY-MM-DD)
  fecha_hasta?: string;    // Fecha fin del rango (YYYY-MM-DD)
  activas_only?: boolean;  // Solo solicitudes actualmente en curso
  skip?: number;           // Registros a saltar (paginación)
  limit?: number;          // Máximo de registros a retornar
}

/**
 * Labels para mostrar en UI
 */
export const VACACION_TIPO_LABELS: Record<VacacionTipo, string> = {
  vacation: 'Vacaciones',
  sick_leave: 'Baja Médica',
  personal: 'Asunto Personal',
  other: 'Otro'
};

export const VACACION_ESTADO_LABELS: Record<VacacionEstado, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada'
};
