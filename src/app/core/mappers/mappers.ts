// ============================================
// MAPPERS COMPLETOS
// ============================================
// Funciones para convertir DTOs de la API a modelos del frontend

import {
  parseUserRole,
  parseUserStatus,
  parseTicketStatus,
  parsePaymentStatus,
  UserRole,
  UserStatus,
  TicketStatus,
  PaymentStatus,
  SpaceType,
  ProductCategory,
  LoanStatus,
  ProductUsageType,
  NotificationType,
} from '../models/enums';

import {
  User,
  Ticket,
  TicketDetalle,
  Espacio,
  Producto,
  PrestamoMaterial,
  Notificacion,
  CuentaBancaria,
  AuthUser,
  AuthResponse,
} from '../models/models';

import {
  UsuarioDTO,
  TicketDTO,
  TicketDetalleDTO,
  TicketFiltroDTO,
  PrestamoDTO,
  NotificacionDTO,
  LoginResponseDTO,
} from '../models/api-models';

// ============================================
// USER MAPPERS
// ============================================

export function mapUserFromApi(dto: UsuarioDTO): User {
  return {
    id: String(dto.usuarioId ?? ''),
    nombreCompleto: dto.nombreCompleto ?? '',
    email: dto.email ?? '',
    folio: dto.folio,
    idAlumno: dto.idAlumno,
    telefono: dto.telefono,
    rol: parseUserRole(dto.rol ?? 'Paciente'),
    estado: parseUserStatus(dto.estado ?? 'Activo'),
    foto: dto.foto,
    ultimaConexion: dto.ultimaConexion ? new Date(dto.ultimaConexion) : undefined,
    fechaCreacion: dto.fechaCreacion ? new Date(dto.fechaCreacion) : undefined,
  };
}

/**
 * Mapea un rol de la API al enum UserRole
 */
export function mapRoleFromApi(apiRole?: string): UserRole {
  if (!apiRole) return UserRole.PACIENTE;
  return parseUserRole(apiRole);
}

/**
 * Mapea un estado de la API al enum UserStatus
 */
export function mapStatusFromApi(apiStatus?: string): UserStatus {
  if (!apiStatus) return UserStatus.ACTIVO;
  return parseUserStatus(apiStatus);
}

export function mapAuthUserFromApi(dto: LoginResponseDTO): AuthUser {
  return {
    id: String(dto.usuarioId ?? ''),
    nombreCompleto: dto.nombreCompleto ?? '',
    email: dto.email ?? '',
    rol: parseUserRole(dto.rol ?? 'Paciente'),
    foto: undefined,
  };
}

export function mapAuthResponseFromApi(dto: LoginResponseDTO): AuthResponse {
  return {
    accessToken: dto.accessToken,
    refreshToken: dto.refreshToken,
    type: dto.type ?? 'Bearer',
    usuarioId: dto.usuarioId ?? 0,
    nombreCompleto: dto.nombreCompleto ?? '',
    email: dto.email ?? '',
    rol: parseUserRole(dto.rol ?? 'Paciente'),
    expiresIn: dto.expiresIn ?? 3600,
  };
}

// ============================================
// TICKET MAPPERS
// ============================================

export function mapTicketFromApi(dto: TicketDTO): Ticket {
  return {
    ticketId: dto.ticketId ?? 0,
    folio: dto.folio ?? '',
    fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
    duracion: undefined,

    // Relaciones
    pacienteId: 0, // No viene en TicketDTO básico
    pacienteNombre: dto.pacienteNombre ?? '',
    pacienteEmail: undefined,

    terapeutaId: 0, // No viene en TicketDTO básico
    terapeutaNombre: dto.terapeutaNombre ?? '',
    terapeutaEmail: undefined,

    espacioId: undefined,
    espacioNombre: dto.espacioNombre,

    cuentaDestinoId: 0, // No viene en TicketDTO básico

    // Información
    materia: '',
    conceptoIngreso: undefined,
    conceptoTransferencia: undefined,
    notas: undefined,

    // Datos de pago
    montoPagado: dto.costoTotal ?? 0,
    celular: undefined,

    // Costos
    costoEspacio: 0,
    costoMateriales: 0,
    costoAdicional: 0,
    costoTotal: dto.costoTotal ?? 0,

    // Estados
    estadoTicket: parseTicketStatus(dto.estadoTicket ?? 'Agendado'),
    estadoPago: parsePaymentStatus(dto.estadoPago ?? 'Pendiente'),

    // Auditoría
    creadoPorId: undefined,
    fechaCreacion: dto.fecha ? new Date(dto.fecha) : new Date(),
    ultimaActualizacion: undefined,

    // Detalles
    detalles: dto.detalles?.map(mapTicketDetalleFromApi) ?? [],
  };
}

export function mapTicketFiltroFromApi(dto: TicketFiltroDTO): Ticket {
  return {
    ticketId: dto.ticketId ?? 0,
    folio: dto.folio ?? '',
    fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
    duracion: undefined,

    pacienteId: 0,
    pacienteNombre: dto.pacienteNombre ?? '',
    pacienteEmail: dto.pacienteEmail,

    terapeutaId: 0,
    terapeutaNombre: dto.terapeutaNombre ?? '',
    terapeutaEmail: dto.terapeutaEmail,

    espacioId: undefined,
    espacioNombre: dto.espacioNombre,

    cuentaDestinoId: 0,

    materia: dto.materia ?? '',
    conceptoIngreso: undefined,
    conceptoTransferencia: undefined,
    notas: undefined,

    montoPagado: dto.costoTotal ?? 0,
    celular: undefined,

    costoEspacio: 0,
    costoMateriales: 0,
    costoAdicional: 0,
    costoTotal: dto.costoTotal ?? 0,

    estadoTicket: parseTicketStatus(dto.estadoTicket ?? 'Agendado'),
    estadoPago: parsePaymentStatus(dto.estadoPago ?? 'Pendiente'),

    creadoPorId: undefined,
    fechaCreacion: dto.fechaCreacion ? new Date(dto.fechaCreacion) : new Date(),
    ultimaActualizacion: undefined,

    detalles: dto.detalles?.map(mapTicketDetalleFromApi) ?? [],
  };
}

export function mapTicketDetalleFromApi(dto: TicketDetalleDTO): TicketDetalle {
  return {
    detalleId: dto.detalleId ?? 0,
    ticketId: 0, // Se establece en el contexto del ticket padre
    productoId: dto.productoId ?? 0,
    productoNombre: dto.productoNombre ?? '',
    productoCodigo: dto.productoCodigo ?? '',
    cantidad: dto.cantidad ?? 0,
    precioUnitario: dto.precioUnitario ?? 0,
    subtotal: dto.subtotal ?? 0,
    tipoUso: parseProductUsageType(dto.tipoUso ?? 'Uso'),
  };
}

// ============================================
// PRÉSTAMO MAPPERS
// ============================================

export function mapPrestamoFromApi(dto: PrestamoDTO): PrestamoMaterial {
  return {
    prestamoId: dto.prestamoId ?? 0,
    ticketId: undefined,
    alumnoId: 0, // No viene en PrestamoDTO
    alumnoNombre: dto.alumnoNombre ?? '',
    productoId: 0, // No viene en PrestamoDTO
    productoNombre: dto.productoNombre ?? '',
    fechaPrestamo: dto.fechaPrestamo ? new Date(dto.fechaPrestamo) : new Date(),
    fechaDevolucionEstimada: dto.fechaDevolucionEstimada
      ? new Date(dto.fechaDevolucionEstimada)
      : new Date(),
    fechaDevolucionReal: dto.fechaDevolucionReal ? new Date(dto.fechaDevolucionReal) : undefined,
    cantidad: 1,
    estadoPrestamo: parseLoanStatus(dto.estadoPrestamo ?? 'Activo'),
    observaciones: undefined,
    diasVencidos: dto.diasVencidos,
  };
}

// ============================================
// NOTIFICACIÓN MAPPERS
// ============================================

export function mapNotificacionFromApi(dto: NotificacionDTO): Notificacion {
  return {
    notificacionId: dto.notificacionId ?? 0,
    usuarioId: 0, // No viene en NotificacionDTO
    tipo: parseNotificationType(dto.tipo ?? 'General'),
    titulo: dto.titulo ?? '',
    mensaje: dto.mensaje ?? '',
    leida: dto.leida ?? false,
    fechaLeida: undefined,
    referenciaId: undefined,
    referenciaUrl: dto.referenciaUrl,
    fechaCreacion: dto.fechaCreacion ? new Date(dto.fechaCreacion) : new Date(),
  };
}

// ============================================
// HELPER PARSERS
// ============================================

function parseProductUsageType(value: string): ProductUsageType {
  const normalized = value.trim();
  switch (normalized) {
    case 'Venta':
    case 'VENTA':
      return ProductUsageType.VENTA;
    case 'Prestamo':
    case 'PRESTAMO':
    case 'Préstamo':
      return ProductUsageType.PRESTAMO;
    case 'Uso':
    case 'USO':
      return ProductUsageType.USO;
    default:
      console.warn(`Tipo de uso desconocido: ${value}, usando Uso por defecto`);
      return ProductUsageType.USO;
  }
}

function parseLoanStatus(value: string): LoanStatus {
  const normalized = value.trim();
  switch (normalized) {
    case 'Activo':
    case 'ACTIVO':
      return LoanStatus.ACTIVO;
    case 'Devuelto':
    case 'DEVUELTO':
      return LoanStatus.DEVUELTO;
    case 'Vencido':
    case 'VENCIDO':
      return LoanStatus.VENCIDO;
    case 'Perdido':
    case 'PERDIDO':
      return LoanStatus.PERDIDO;
    default:
      console.warn(`Estado de prestamo desconocido: ${value}, usando Activo por defecto`);
      return LoanStatus.ACTIVO;
  }
}

function parseNotificationType(value: string): NotificationType {
  const normalized = value.trim();
  switch (normalized) {
    case 'CitaProxima':
    case 'CITA_PROXIMA':
      return NotificationType.CITA_PROXIMA;
    case 'PagoVerificado':
    case 'PAGO_VERIFICADO':
      return NotificationType.PAGO_VERIFICADO;
    case 'PagoRechazado':
    case 'PAGO_RECHAZADO':
      return NotificationType.PAGO_RECHAZADO;
    case 'MaterialVencido':
    case 'MATERIAL_VENCIDO':
      return NotificationType.MATERIAL_VENCIDO;
    case 'StockBajo':
    case 'STOCK_BAJO':
      return NotificationType.STOCK_BAJO;
    case 'General':
    case 'GENERAL':
      return NotificationType.GENERAL;
    default:
      console.warn(`Tipo de notificacion desconocido: ${value}, usando General por defecto`);
      return NotificationType.GENERAL;
  }
}

// ============================================
// REVERSE MAPPERS (Frontend -> API)
// ============================================

export function mapRoleToApi(role: UserRole): string {
  return role; // Los enums ya tienen el valor correcto
}

export function mapStatusToApi(status: UserStatus): string {
  return status; // Los enums ya tienen el valor correcto
}

export function mapTicketStatusToApi(status: TicketStatus): string {
  return status; // Los enums ya tienen el valor correcto
}

export function mapPaymentStatusToApi(status: PaymentStatus): string {
  return status; // Los enums ya tienen el valor correcto
}

export function mapProductUsageTypeToApi(type: ProductUsageType): string {
  return type; // Los enums ya tienen el valor correcto
}
