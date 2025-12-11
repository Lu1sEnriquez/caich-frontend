// ============================================
// ENUMS Y TIPOS CENTRALIZADOS
// ============================================
// Este archivo contiene todos los tipos y enums usados en la app
// Si la API cambia algo, solo se edita aquí

/**
 * Roles de usuario según la API
 * API values: "Administrador", "Terapeuta", "Alumno", "Paciente"
 */
export enum UserRole {
  ADMINISTRADOR = 'Administrador',
  TERAPEUTA = 'Terapeuta',
  ALUMNO = 'Alumno',
  PACIENTE = 'Paciente',
}

/**
 * Estados de usuario según la API
 * API values: "Activo", "Suspendido", "Inactivo"
 */
export enum UserStatus {
  ACTIVO = 'Activo',
  SUSPENDIDO = 'Suspendido',
  INACTIVO = 'Inactivo',
}

/**
 * Estados de ticket según la API
 * API values: "Agendado", "Completado", "Cancelado", "NoAsistio"
 */
export enum TicketStatus {
  AGENDADO = 'Agendado',
  COMPLETADO = 'Completado',
  CANCELADO = 'Cancelado',
  NO_ASISTIO = 'NoAsistio',
}

/**
 * Estados de pago según la API
 * API values: "Pendiente", "Pagado", "Verificado", "Rechazado"
 */
export enum PaymentStatus {
  PENDIENTE = 'Pendiente',
  PAGADO = 'Pagado',
  VERIFICADO = 'Verificado',
  RECHAZADO = 'Rechazado',
}

/**
 * Tipos de espacio según la API
 * API values: "Cubículo", "Consultorio", "Sala"
 */
export enum SpaceType {
  CUBICULO = 'Cubículo',
  CONSULTORIO = 'Consultorio',
  SALA = 'Sala',
}

/**
 * Categorías de producto según la API
 * API values: "Material", "Libro", "Test", "Equipo", "Otro"
 */
export enum ProductCategory {
  MATERIAL = 'Material',
  LIBRO = 'Libro',
  TEST = 'Test',
  EQUIPO = 'Equipo',
  OTRO = 'Otro',
}

/**
 * Estados de préstamo según la API
 * API values: "Activo", "Devuelto", "Vencido", "Perdido"
 */
export enum LoanStatus {
  ACTIVO = 'Activo',
  DEVUELTO = 'Devuelto',
  VENCIDO = 'Vencido',
  PERDIDO = 'Perdido',
}

/**
 * Tipos de uso de producto en ticket según la API
 * API values: "Venta", "Prestamo", "Uso"
 */
export enum ProductUsageType {
  VENTA = 'Venta',
  PRESTAMO = 'Prestamo',
  USO = 'Uso',
}

/**
 * Tipos de notificación según la API
 * API values: "CitaProxima", "PagoVerificado", "PagoRechazado", "MaterialVencido", "StockBajo", "General"
 */
export enum NotificationType {
  CITA_PROXIMA = 'CitaProxima',
  PAGO_VERIFICADO = 'PagoVerificado',
  PAGO_RECHAZADO = 'PagoRechazado',
  MATERIAL_VENCIDO = 'MaterialVencido',
  STOCK_BAJO = 'StockBajo',
  GENERAL = 'General',
}

// ============================================
// PARSER FUNCTIONS
// ============================================

/**
 * Convierte un valor de rol de la API al enum
 */
export function parseUserRole(value: string): UserRole {
  const normalized = value.trim();
  switch (normalized) {
    case 'Administrador':
    case 'ADMINISTRADOR':
      return UserRole.ADMINISTRADOR;
    case 'Terapeuta':
    case 'TERAPEUTA':
      return UserRole.TERAPEUTA;
    case 'Alumno':
    case 'ALUMNO':
      return UserRole.ALUMNO;
    case 'Paciente':
    case 'PACIENTE':
      return UserRole.PACIENTE;
    default:
      console.warn(`Rol desconocido: ${value}, usando Paciente por defecto`);
      return UserRole.PACIENTE;
  }
}

/**
 * Convierte un valor de estado de usuario de la API al enum
 */
export function parseUserStatus(value: string): UserStatus {
  const normalized = value.trim();
  switch (normalized) {
    case 'Activo':
    case 'ACTIVO':
      return UserStatus.ACTIVO;
    case 'Suspendido':
    case 'SUSPENDIDO':
      return UserStatus.SUSPENDIDO;
    case 'Inactivo':
    case 'INACTIVO':
      return UserStatus.INACTIVO;
    default:
      console.warn(`Estado desconocido: ${value}, usando Activo por defecto`);
      return UserStatus.ACTIVO;
  }
}

/**
 * Convierte un valor de estado de ticket de la API al enum
 */
export function parseTicketStatus(value: string): TicketStatus {
  const normalized = value.trim();
  switch (normalized) {
    case 'Agendado':
    case 'AGENDADO':
      return TicketStatus.AGENDADO;
    case 'Completado':
    case 'COMPLETADO':
      return TicketStatus.COMPLETADO;
    case 'Cancelado':
    case 'CANCELADO':
      return TicketStatus.CANCELADO;
    case 'NoAsistio':
    case 'NO_ASISTIO':
      return TicketStatus.NO_ASISTIO;
    default:
      console.warn(`Estado de ticket desconocido: ${value}, usando Agendado por defecto`);
      return TicketStatus.AGENDADO;
  }
}

/**
 * Convierte un valor de estado de pago de la API al enum
 */
export function parsePaymentStatus(value: string): PaymentStatus {
  const normalized = value.trim();
  switch (normalized) {
    case 'Pendiente':
    case 'PENDIENTE':
      return PaymentStatus.PENDIENTE;
    case 'Pagado':
    case 'PAGADO':
      return PaymentStatus.PAGADO;
    case 'Verificado':
    case 'VERIFICADO':
      return PaymentStatus.VERIFICADO;
    case 'Rechazado':
    case 'RECHAZADO':
      return PaymentStatus.RECHAZADO;
    default:
      console.warn(`Estado de pago desconocido: ${value}, usando Pendiente por defecto`);
      return PaymentStatus.PENDIENTE;
  }
}

// ============================================
// PERMISSION CHECK FUNCTIONS
// ============================================

/**
 * Verifica si un rol tiene permisos de administrador
 */
export function isAdmin(role: UserRole): boolean {
  return role === UserRole.ADMINISTRADOR;
}

/**
 * Verifica si un rol puede gestionar citas
 */
export function canManageAppointments(role: UserRole): boolean {
  return role === UserRole.ADMINISTRADOR || role === UserRole.TERAPEUTA;
}

/**
 * Verifica si un rol puede gestionar usuarios
 */
export function canManageUsers(role: UserRole): boolean {
  return role === UserRole.ADMINISTRADOR;
}

/**
 * Verifica si un rol puede gestionar pagos
 */
export function canManagePayments(role: UserRole): boolean {
  return role === UserRole.ADMINISTRADOR;
}

/**
 * Verifica si un rol puede ver reportes
 */
export function canViewReports(role: UserRole): boolean {
  return role === UserRole.ADMINISTRADOR || role === UserRole.TERAPEUTA;
}
