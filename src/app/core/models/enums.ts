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
 * API values: "BORRADOR", "AGENDADO", "EN_PROGRESO", "COMPLETADO", "CANCELADO"
 */
export enum TicketStatus {
  BORRADOR = 'BORRADOR',
  AGENDADO = 'AGENDADO',
  EN_PROGRESO = 'EN_PROGRESO',
  COMPLETADO = 'COMPLETADO',
  CANCELADO = 'CANCELADO',
}

/**
 * Estados financieros del ticket según la API
 * API values: "PENDIENTE", "PAGO_PARCIAL", "EN_REVISION", "PAGADO", "REEMBOLSADO"
 */
export enum FinancialStatus {
  PENDIENTE = 'PENDIENTE',
  PAGO_PARCIAL = 'PAGO_PARCIAL',
  EN_REVISION = 'EN_REVISION',
  PAGADO = 'PAGADO',
  REEMBOLSADO = 'REEMBOLSADO',
}

/**
 * Estados de la transaccion de pago según la API
 * API values: "PENDIENTE_REVISION", "APROBADO", "RECHAZADO"
 */
export enum TransactionStatus {
  PENDIENTE_REVISION = 'PENDIENTE_REVISION',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
}

/**
 * Metodos de pago según la API
 * API values: "EFECTIVO", "TRANSFERENCIA", "DEPOSITO", "TARJETA"
 */
export enum PaymentMethod {
  EFECTIVO = 'EFECTIVO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  DEPOSITO = 'DEPOSITO',
  TARJETA = 'TARJETA',
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
    case 'BORRADOR':
      return TicketStatus.BORRADOR;
    case 'Agendado':
    case 'AGENDADO':
      return TicketStatus.AGENDADO;
    case 'EN_PROGRESO':
      return TicketStatus.EN_PROGRESO;
    case 'Completado':
    case 'COMPLETADO':
      return TicketStatus.COMPLETADO;
    case 'Cancelado':
    case 'CANCELADO':
      return TicketStatus.CANCELADO;
    default:
      console.warn(`Estado de ticket desconocido: ${value}, usando BORRADOR por defecto`);
      return TicketStatus.BORRADOR;
  }
}

/**
 * Convierte un valor de estado financiero de la API al enum
 */
export function parseFinancialStatus(value: string): FinancialStatus {
  const normalized = value.trim();
  switch (normalized) {
    case 'Pendiente':
    case 'PENDIENTE':
      return FinancialStatus.PENDIENTE;
    case 'PagoParcial':
    case 'Pago Parcial':
    case 'PAGO_PARCIAL':
      return FinancialStatus.PAGO_PARCIAL;
    case 'EnRevision':
    case 'En Revision':
    case 'EN_REVISION':
      return FinancialStatus.EN_REVISION;
    case 'Pagado':
    case 'PAGADO':
      return FinancialStatus.PAGADO;
    case 'Reembolsado':
    case 'REEMBOLSADO':
      return FinancialStatus.REEMBOLSADO;
    default:
      console.warn(`Estado financiero desconocido: ${value}, usando PENDIENTE por defecto`);
      return FinancialStatus.PENDIENTE;
  }
}

/**
 * Convierte un valor de estado de transaccion de la API al enum
 */
export function parseTransactionStatus(value: string): TransactionStatus {
  const normalized = value.trim();
  switch (normalized) {
    case 'PENDIENTE_REVISION':
      return TransactionStatus.PENDIENTE_REVISION;
    case 'APROBADO':
      return TransactionStatus.APROBADO;
    case 'RECHAZADO':
      return TransactionStatus.RECHAZADO;
    default:
      console.warn(`Estado de transaccion desconocido: ${value}, usando PENDIENTE_REVISION por defecto`);
      return TransactionStatus.PENDIENTE_REVISION;
  }
}

/**
 * Convierte un valor de metodo de pago de la API al enum
 */
export function parsePaymentMethod(value: string): PaymentMethod {
  const normalized = value.trim();
  switch (normalized) {
    case 'EFECTIVO':
      return PaymentMethod.EFECTIVO;
    case 'TRANSFERENCIA':
      return PaymentMethod.TRANSFERENCIA;
    case 'DEPOSITO':
      return PaymentMethod.DEPOSITO;
    case 'TARJETA':
      return PaymentMethod.TARJETA;
    default:
      console.warn(`Metodo de pago desconocido: ${value}, usando EFECTIVO por defecto`);
      return PaymentMethod.EFECTIVO;
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
