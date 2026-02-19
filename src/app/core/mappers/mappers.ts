// ============================================
// MAPPERS COMPLETOS
// ============================================
// Funciones para convertir DTOs de la API a modelos del frontend

import {
  parseUserRole,
  parseUserStatus,
  parseTicketStatus,
  parseFinancialStatus,
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

import {
  User,
  Ticket,
  TicketVenta,
  TicketCita,
  TicketEspacio,
  TicketPrestamo,
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
  TicketResponseDTO,
  TicketFiltroResponseDTO,
  TicketVentaDTO,
  TicketCitaDTO,
  TicketEspacioDTO,
  TicketPrestamoDTO,
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

export function mapTicketFromApi(dto: TicketResponseDTO): Ticket {
  return {
    ticketId: dto.ticketId ?? 0,
    folio: dto.folio ?? '',
    creadoPorId: dto.creadoPorId,
    creadoPorNombre: dto.creadoPorNombre,
    estadoTicket: parseTicketStatus(dto.estadoTicket ?? 'BORRADOR'),
    estadoFinanciero: parseFinancialStatus(dto.estadoFinanciero ?? 'PENDIENTE'),
    ventas: dto.ventas?.map(mapTicketVentaFromApi) ?? [],
    cita: dto.cita ? mapTicketCitaFromApi(dto.cita) : undefined,
    espacios: dto.espacios?.map(mapTicketEspacioFromApi) ?? [],
    prestamos: dto.prestamos?.map(mapTicketPrestamoFromApi) ?? [],
    costoAdicional: dto.costoAdicional ?? 0,
    motivoCostoAdicional: dto.motivoCostoAdicional,
    montoTotal: dto.montoTotal ?? 0,
    montoPagado: dto.montoPagado ?? 0,
    saldoPendiente: dto.saldoPendiente ?? 0,
    cantidadPagos: dto.cantidadPagos ?? 0,
    fechaCreacion: dto.fechaCreacion ? new Date(dto.fechaCreacion) : undefined,
    ultimaActualizacion: dto.ultimaActualizacion
      ? new Date(dto.ultimaActualizacion)
      : undefined,
  };
}

export function mapTicketFiltroFromApi(dto: TicketFiltroResponseDTO): Ticket {
  return {
    ticketId: dto.ticketId ?? 0,
    folio: dto.folio ?? '',
    creadoPorNombre: dto.creadoPorNombre,
    estadoTicket: parseTicketStatus(dto.estadoTicket ?? 'BORRADOR'),
    estadoFinanciero: parseFinancialStatus(dto.estadoFinanciero ?? 'PENDIENTE'),
    montoTotal: dto.montoTotal ?? 0,
    montoPagado: dto.montoPagado ?? 0,
    saldoPendiente: dto.saldoPendiente ?? 0,
    fechaCreacion: dto.fechaCreacion ? new Date(dto.fechaCreacion) : undefined,
  };
}

export function mapTicketVentaFromApi(dto: TicketVentaDTO): TicketVenta {
  return {
    ventaId: dto.ventaId ?? 0,
    productoId: dto.productoId ?? 0,
    productoNombre: dto.productoNombre ?? '',
    productoCodigo: dto.productoCodigo ?? '',
    cantidad: dto.cantidad ?? 0,
    precioUnitario: dto.precioUnitario ?? 0,
    subtotal: dto.subtotal ?? 0,
  };
}

export function mapTicketCitaFromApi(dto: TicketCitaDTO): TicketCita {
  return {
    citaId: dto.citaId ?? 0,
    pacienteId: dto.pacienteId ?? 0,
    pacienteNombre: dto.pacienteNombre ?? '',
    terapeutaId: dto.terapeutaId ?? 0,
    terapeutaNombre: dto.terapeutaNombre ?? '',
    fechaInicio: dto.fechaInicio ? new Date(dto.fechaInicio) : new Date(),
    fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : new Date(),
    precioCobrado: dto.precioCobrado ?? 0,
    notasTerapia: dto.notasTerapia,
  };
}

export function mapTicketEspacioFromApi(dto: TicketEspacioDTO): TicketEspacio {
  return {
    espacioReservaId: dto.espacioReservaId ?? 0,
    espacioId: dto.espacioId ?? 0,
    espacioNombre: dto.espacioNombre ?? '',
    horaInicioReserva: dto.horaInicioReserva ? new Date(dto.horaInicioReserva) : new Date(),
    horaFinReserva: dto.horaFinReserva ? new Date(dto.horaFinReserva) : new Date(),
    costoCobrado: dto.costoCobrado ?? 0,
  };
}

export function mapTicketPrestamoFromApi(dto: TicketPrestamoDTO): TicketPrestamo {
  return {
    prestamoId: dto.prestamoId ?? 0,
    productoId: dto.productoId ?? 0,
    productoNombre: dto.productoNombre ?? '',
    responsableId: dto.responsableId ?? 0,
    responsableNombre: dto.responsableNombre ?? '',
    fechaPrestamo: dto.fechaPrestamo ? new Date(dto.fechaPrestamo) : new Date(),
    fechaDevolucionEstimada: dto.fechaDevolucionEstimada
      ? new Date(dto.fechaDevolucionEstimada)
      : new Date(),
    fechaDevolucionReal: dto.fechaDevolucionReal ? new Date(dto.fechaDevolucionReal) : undefined,
    estado: parseLoanStatus(dto.estado ?? 'Activo'),
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

export function mapFinancialStatusToApi(status: FinancialStatus): string {
  return status; // Los enums ya tienen el valor correcto
}

export function mapProductUsageTypeToApi(type: ProductUsageType): string {
  return type; // Los enums ya tienen el valor correcto
}
