/**
 * Utilidades para conversión y presentación de enums/estados
 * Centraliza la lógica para obtener labels, badges, colores, etc.
 */

import {
  UserRole,
  UserStatus,
  TicketStatus,
  FinancialStatus,
  SpaceType,
  ProductCategory,
  LoanStatus,
  ProductUsageType,
  NotificationType,
} from '../models/enums';

// ============================================
// USER ROLE UTILITIES
// ============================================

/**
 * Obtiene el label amigable para un rol de usuario
 */
export function getUserRoleLabel(role: UserRole): string {
  switch (role) {
    case UserRole.ADMINISTRADOR:
      return 'Administrador';
    case UserRole.TERAPEUTA:
      return 'Terapeuta';
    case UserRole.ALUMNO:
      return 'Alumno';
    case UserRole.PACIENTE:
      return 'Paciente';
    default:
      return role;
  }
}

/**
 * Obtiene el color/badge para un rol de usuario
 */
export function getUserRoleBadgeClass(role: UserRole): string {
  switch (role) {
    case UserRole.ADMINISTRADOR:
      return 'badge-danger';
    case UserRole.TERAPEUTA:
      return 'badge-primary';
    case UserRole.ALUMNO:
      return 'badge-info';
    case UserRole.PACIENTE:
      return 'badge-success';
    default:
      return 'badge-default';
  }
}

/**
 * Obtiene el icono para un rol de usuario
 */
export function getUserRoleIcon(role: UserRole): string {
  switch (role) {
    case UserRole.ADMINISTRADOR:
      return '';
    case UserRole.TERAPEUTA:
      return '👨‍⚕️';
    case UserRole.ALUMNO:
      return '👨‍🎓';
    case UserRole.PACIENTE:
      return '🤕';
    default:
      return '';
  }
}

// ============================================
// USER STATUS UTILITIES
// ============================================

/**
 * Obtiene el label amigable para un estado de usuario
 */
export function getUserStatusLabel(status: UserStatus): string {
  switch (status) {
    case UserStatus.ACTIVO:
      return 'Activo';
    case UserStatus.SUSPENDIDO:
      return 'Suspendido';
    case UserStatus.INACTIVO:
      return 'Inactivo';
    default:
      return status;
  }
}

/**
 * Obtiene el color/badge para un estado de usuario
 */
export function getUserStatusBadgeClass(status: UserStatus): string {
  switch (status) {
    case UserStatus.ACTIVO:
      return 'badge-success';
    case UserStatus.SUSPENDIDO:
      return 'badge-warning';
    case UserStatus.INACTIVO:
      return 'badge-danger';
    default:
      return 'badge-default';
  }
}

// ============================================
// TICKET STATUS UTILITIES
// ============================================

/**
 * Obtiene el label amigable para un estado de ticket
 */
export function getTicketStatusLabel(status: TicketStatus | string): string {
  const normalized = String(status).toUpperCase();
  switch (normalized) {
    case TicketStatus.BORRADOR:
      return 'Borrador';
    case TicketStatus.AGENDADO:
      return 'Agendado';
    case TicketStatus.EN_PROGRESO:
      return 'En progreso';
    case TicketStatus.COMPLETADO:
      return 'Completado';
    case TicketStatus.CANCELADO:
      return 'Cancelado';
    default:
      return normalized || String(status);
  }
}

/**
 * Obtiene el color/badge para un estado de ticket
 */
export function getTicketStatusBadgeClass(status: TicketStatus | string): string {
  const normalized = String(status).toUpperCase();
  switch (normalized) {
    case TicketStatus.BORRADOR:
      return 'badge-secondary';
    case TicketStatus.AGENDADO:
      return 'badge-warning';
    case TicketStatus.EN_PROGRESO:
      return 'badge-info';
    case TicketStatus.COMPLETADO:
      return 'badge-success';
    case TicketStatus.CANCELADO:
      return 'badge-danger';
    default:
      return 'badge-default';
  }
}

/**
 * Obtiene el icono para un estado de ticket
 */
export function getTicketStatusIcon(status: TicketStatus | string): string {
  const normalized = String(status).toUpperCase();
  switch (normalized) {
    case TicketStatus.BORRADOR:
      return '';
    case TicketStatus.AGENDADO:
      return '';
    case TicketStatus.EN_PROGRESO:
      return '';
    case TicketStatus.COMPLETADO:
      return '';
    case TicketStatus.CANCELADO:
      return '';
    default:
      return '';
  }
}

// ============================================
// PAYMENT STATUS UTILITIES
// ============================================

/**
 * Obtiene el label amigable para un estado de pago
 */
export function getPaymentStatusLabel(status: FinancialStatus | string): string {
  const normalized = String(status).toUpperCase();
  switch (normalized) {
    case FinancialStatus.PENDIENTE:
      return 'Pendiente';
    case FinancialStatus.PAGO_PARCIAL:
      return 'Pago parcial';
    case FinancialStatus.EN_REVISION:
      return 'En revision';
    case FinancialStatus.PAGADO:
      return 'Pagado';
    case FinancialStatus.REEMBOLSADO:
      return 'Reembolsado';
    default:
      return String(status);
  }
}

/**
 * Obtiene el color/badge para un estado de pago
 */
export function getPaymentStatusBadgeClass(status: FinancialStatus | string): string {
  const normalized = String(status).toUpperCase();
  switch (normalized) {
    case FinancialStatus.PENDIENTE:
      return 'badge-warning';
    case FinancialStatus.PAGO_PARCIAL:
      return 'badge-info';
    case FinancialStatus.EN_REVISION:
      return 'badge-secondary';
    case FinancialStatus.PAGADO:
      return 'badge-success';
    case FinancialStatus.REEMBOLSADO:
      return 'badge-danger';
    default:
      return 'badge-default';
  }
}

/**
 * Obtiene el icono para un estado de pago
 */
export function getPaymentStatusIcon(status: FinancialStatus | string): string {
  const normalized = String(status).toUpperCase();
  switch (normalized) {
    case FinancialStatus.PENDIENTE:
      return '';
    case FinancialStatus.PAGO_PARCIAL:
      return '';
    case FinancialStatus.EN_REVISION:
      return '';
    case FinancialStatus.PAGADO:
      return '';
    case FinancialStatus.REEMBOLSADO:
      return '';
    default:
      return '';
  }
}

// ============================================
// LOAN STATUS UTILITIES
// ============================================

/**
 * Obtiene el label amigable para un estado de préstamo
 */
export function getLoanStatusLabel(status: LoanStatus): string {
  switch (status) {
    case LoanStatus.ACTIVO:
      return 'Activo';
    case LoanStatus.DEVUELTO:
      return 'Devuelto';
    case LoanStatus.VENCIDO:
      return 'Vencido';
    case LoanStatus.PERDIDO:
      return 'Perdido';
    default:
      return status;
  }
}

/**
 * Obtiene el color/badge para un estado de préstamo
 */
export function getLoanStatusBadgeClass(status: LoanStatus): string {
  switch (status) {
    case LoanStatus.ACTIVO:
      return 'badge-info';
    case LoanStatus.DEVUELTO:
      return 'badge-success';
    case LoanStatus.VENCIDO:
      return 'badge-warning';
    case LoanStatus.PERDIDO:
      return 'badge-danger';
    default:
      return 'badge-default';
  }
}

// ============================================
// SPACE TYPE UTILITIES
// ============================================

/**
 * Obtiene el label amigable para un tipo de espacio
 */
export function getSpaceTypeLabel(type: SpaceType): string {
  switch (type) {
    case SpaceType.CUBICULO:
      return 'Cubículo';
    case SpaceType.CONSULTORIO:
      return 'Consultorio';
    case SpaceType.SALA:
      return 'Sala';
    default:
      return type;
  }
}

// ============================================
// PRODUCT CATEGORY UTILITIES
// ============================================

/**
 * Obtiene el label amigable para una categoría de producto
 */
export function getProductCategoryLabel(category: ProductCategory): string {
  switch (category) {
    case ProductCategory.MATERIAL:
      return 'Material';
    case ProductCategory.LIBRO:
      return 'Libro';
    case ProductCategory.TEST:
      return 'Test';
    case ProductCategory.EQUIPO:
      return 'Equipo';
    case ProductCategory.OTRO:
      return 'Otro';
    default:
      return category;
  }
}

// ============================================
// NOTIFICATION TYPE UTILITIES
// ============================================

/**
 * Obtiene el label amigable para un tipo de notificación
 */
export function getNotificationTypeLabel(type: NotificationType): string {
  switch (type) {
    case NotificationType.CITA_PROXIMA:
      return 'Cita Próxima';
    case NotificationType.PAGO_VERIFICADO:
      return 'Pago Verificado';
    case NotificationType.PAGO_RECHAZADO:
      return 'Pago Rechazado';
    case NotificationType.MATERIAL_VENCIDO:
      return 'Material Vencido';
    case NotificationType.STOCK_BAJO:
      return 'Stock Bajo';
    case NotificationType.GENERAL:
      return 'General';
    default:
      return type;
  }
}

/**
 * Obtiene el icono para un tipo de notificación
 */
export function getNotificationTypeIcon(type: NotificationType): string {
  switch (type) {
    case NotificationType.CITA_PROXIMA:
      return '';
    case NotificationType.PAGO_VERIFICADO:
      return '';
    case NotificationType.PAGO_RECHAZADO:
      return '';
    case NotificationType.MATERIAL_VENCIDO:
      return '';
    case NotificationType.STOCK_BAJO:
      return '';
    case NotificationType.GENERAL:
      return '';
    default:
      return '';
  }
}

// ============================================
// GENERIC STATUS MAPPING
// ============================================

/**
 * Función genérica para obtener badge class basado en estado de string
 * Útil para estados desconocidos o genéricos
 */
export function getGenericStatusBadgeClass(estado: string): string {
  const normalized = estado?.toLowerCase() || '';

  if (normalized.includes('success') || normalized.includes('pagado') || normalized.includes('completado')) {
    return 'badge-success';
  }
  if (normalized.includes('warning') || normalized.includes('pendiente') || normalized.includes('agendado')) {
    return 'badge-warning';
  }
  if (normalized.includes('danger') || normalized.includes('error') || normalized.includes('cancelado')) {
    return 'badge-danger';
  }
  if (normalized.includes('info')) {
    return 'badge-info';
  }
  if (normalized.includes('secondary')) {
    return 'badge-secondary';
  }

  return 'badge-default';
}
