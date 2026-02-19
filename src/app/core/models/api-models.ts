// Tipos mínimos generados a mano a partir del OpenAPI proporcionado.

export interface BaseResponseDTO {
  status: string;
  message?: string;
  timestamp?: string;
}

export interface Pagination<T> {
  content: T;
  pageable: Pageable;
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  sort: Sort;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface Sort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: Sort;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

export interface DataResponseDTO<T> extends BaseResponseDTO {
  data: T;
}

export interface TicketDetalleDTO {
  detalleId?: number;
  productoId?: number;
  productoNombre?: string;
  productoCodigo?: string;
  cantidad?: number;
  precioUnitario?: number;
  subtotal?: number;
  tipoUso?: string;
}

export interface TicketDTO {
  ticketId?: number;
  folio?: string;
  fecha?: string;
  duracion?: number;
  pacienteId?: number;
  pacienteNombre?: string;
  terapeutaId?: number;
  terapeutaNombre?: string;
  espacioId?: number;
  espacioNombre?: string;
  materia?: string;
  modalidad?: string;
  tipoTicket?: string;
  montoPagado?: number;
  costoEspacio?: number;
  costoMateriales?: number;
  costoAdicional?: number;
  costoTotal?: number;
  estadoTicket?: string;
  estadoPago?: string;
  detalles?: TicketDetalleDTO[];
}

export interface TicketFiltroDTO extends TicketDTO {
  pacienteEmail: string;
  terapeutaEmail: string;
  materia: string;
  tipoTicket?: string;
  fechaCreacion: string;
}

// ============================================
// TICKETS MODULARES (NUEVO CONTRATO)
// ============================================

export interface TicketRequestDTO {
  creadoPorId: number;
  estadoTicket?: string;
  estadoFinanciero?: string;
  ventas?: TicketVentaRequestDTO[];
  cita?: TicketCitaRequestDTO;
  espacios?: TicketEspacioRequestDTO[];
  prestamos?: TicketPrestamoRequestDTO[];
  costoAdicional?: number;
  motivoCostoAdicional?: string;
}

export interface TicketVentaRequestDTO {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
}

export interface TicketCitaRequestDTO {
  pacienteId: number;
  terapeutaId: number;
  fechaInicio: string;
  fechaFin: string;
  precioCobrado: number;
  notasTerapia?: string;
  modalidad?: string; // 'Presencial' | 'Online'
}

export interface TicketEspacioRequestDTO {
  espacioId: number;
  horaInicioReserva: string;
  horaFinReserva: string;
  costoCobrado: number;
}

export interface TicketPrestamoRequestDTO {
  productoId: number;
  responsableId: number;
  fechaPrestamo: string;
  fechaDevolucionEstimada: string;
}

export interface TicketResponseDTO {
  ticketId: number;
  folio: string;
  creadoPorId: number;
  creadoPorNombre: string;
  estadoTicket: string;
  estadoFinanciero: string;
  ventas: TicketVentaDTO[];
  cita?: TicketCitaDTO;
  espacios: TicketEspacioDTO[];
  prestamos: TicketPrestamoDTO[];
  costoAdicional: number;
  motivoCostoAdicional?: string;
  montoTotal: number;
  montoPagado: number;
  saldoPendiente: number;
  cantidadPagos: number;
  fechaCreacion: string;
  ultimaActualizacion: string;
}

export interface TicketVentaDTO {
  ventaId: number;
  productoId: number;
  productoNombre: string;
  productoCodigo: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface TicketCitaDTO {
  citaId: number;
  pacienteId: number;
  pacienteNombre: string;
  terapeutaId: number;
  terapeutaNombre: string;
  fechaInicio: string;
  fechaFin: string;
  precioCobrado: number;
  notasTerapia?: string;
}

export interface TicketEspacioDTO {
  espacioReservaId: number;
  espacioId: number;
  espacioNombre: string;
  horaInicioReserva: string;
  horaFinReserva: string;
  costoCobrado: number;
}

export interface TicketPrestamoDTO {
  prestamoId: number;
  productoId: number;
  productoNombre: string;
  responsableId: number;
  responsableNombre: string;
  fechaPrestamo: string;
  fechaDevolucionEstimada: string;
  fechaDevolucionReal?: string;
  estado: string;
}

export interface TicketFiltroResponseDTO {
  ticketId: number;
  folio: string;
  creadoPorNombre: string;
  creadoPorEmail: string;
  estadoTicket: string;
  estadoFinanciero: string;
  pacienteNombre?: string;
  pacienteEmail?: string;
  terapeutaNombre?: string;
  terapeutaEmail?: string;
  fechaInicioCita?: string;
  montoTotal: number;
  montoPagado: number;
  saldoPendiente: number;
  fechaCreacion: string;
}

// ============================================
// PAGOS (NUEVO CONTRATO)
// ============================================

export interface PagoRequestDTO {
  ticketId: number;
  monto: number;
  metodoPago: string;
  comprobanteUrl?: string;
  referencia?: string;
}

export interface PagoResponseDTO {
  pagoId: number;
  ticketId: number;
  ticketFolio: string;
  monto: number;
  metodoPago: string;
  comprobanteUrl?: string;
  referencia?: string;
  estado: string;
  motivoRechazo?: string;
  verificadoPorNombre?: string;
  fechaPago?: string;
  fechaCreacion?: string;
}

export interface Producto {
  productoId?: number;
  codigo: string;       // Obligatorio para evitar el error de SQL
  nombre: string;
  descripcion?: string;
  categoria: string;
  precio: number;
  stock: number;
  stockMinimo: number;
  esVendible: boolean;
  esPrestable: boolean;
  estaActivo?: boolean; // Importante para el borrado lógico
}

export interface CrearProductoRequest extends Omit<Producto, 'productoId'> {}

export interface ActualizarProductoRequest extends Producto {}

export interface PrestamoDTO {
  prestamoId?: number;
  alumnoNombre?: string;
  productoNombre?: string;
  fechaPrestamo?: string;
  fechaDevolucionEstimada?: string;
  fechaDevolucionReal?: string | null;
  estadoPrestamo?: string;
  diasVencidos?: number;
}

export interface NotificacionDTO {
  notificacionId?: number;
  tipo?: string;
  titulo?: string;
  mensaje?: string;
  leida?: boolean;
  fechaCreacion?: string;
  referenciaUrl?: string;
}

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface LoginResponseDTO extends BaseResponseDTO {
  accessToken: string;
  refreshToken: string;
  type?: string;
  usuarioId?: number;
  nombreCompleto?: string;
  email?: string;
  rol?: string;
  expiresIn?: number;
}

export interface DashboardAdminDTO {
  citasHoy?: number;
  pagosPendientes?: number;
  nuevosPacientes?: number;
  citasEsteMes?: number;
  prestamosActivos?: number;
  prestamosVencidos?: number;
  productosStockBajo?: number;
  productosSinStock?: number;
  ingresosMes?: number;
}

// USERS DTO
export interface UsuarioDTO {
  usuarioId?: number;
  nombreCompleto?: string;
  email?: string;
  folio?: string;
  idAlumno?: string;
  telefono?: string;
  rol?: string;
  estado?: string;
  foto?: string;
  ultimaConexion?: string;
  fechaCreacion?: string;
}

export interface CrearUsuarioDTO {
  nombreCompleto: string;
  email: string;
  folio?: string;
  idAlumno?: string;
  password: string;
  telefono?: string;
  rol: string;
  foto?: string;
}

export interface ActualizarUsuarioDTO {
  nombreCompleto?: string;
  email?: string;
  folio?: string;
  idAlumno?: string;
  telefono?: string;
  rol?: string;
  foto?: string;
}

export interface CambiarPasswordDTO {
  currentPassword: string;
  newPassword: string;
}

export interface CambiarEstadoDTO {
  estado: string;
  motivo?: string;
}

export interface CitaDTO {
  ticketId:        number;
  espacioId:       number;
  espacioNombre:   string;
  fecha:           Date;
  duracion:        number;
  pacienteId:      number;
  pacienteNombre:  string;
  terapeutaId:     number;
  terapeutaNombre: string;
  materia:         string;
  modalidad:       'Presencial' | 'Online';
  estadoTicket:    string;
  estadoPago?:     string;
  celular?:        string;
  notas:           string;
  montoPagado?:    number;
  costoEspacio?:   number;
  costoMateriales?:number;
  costoAdicional?: number;
  costoTotal?:     number;
  detalles?:       TicketDetalleDTO[];
  fechaCreacion:   Date;
}

export interface ConfiguracionHorariosDTO {
  configId:            number;
  espacioId:           number;
  espacioNombre:       string;
  fecha:               Date;
  horasDeshabilitadas: string[];
  fechaCreacion:       Date;
}

export interface EspacioDTO {
  espacioId:    number;
  nombre:       string;
  tipo:         string;
  descripcion:  string;
  capacidad:    number;
  costoPorHora: number;
  estaActivo:   boolean;
}

// ============================================
// TIME SLOTS CONFIGURABLES
// ============================================

export interface TimeSlot {
  horaInicio: string; // HH:mm
  horaFin: string;    // HH:mm
  estado: 'DISPONIBLE' | 'OCUPADO' | 'BLOQUEADO';
  razonBloqueo?: string;
  citaId?: number;
}

export interface ConfiguracionOperativaDTO {
  horaApertura: string;          // HH:mm
  horaCierre: string;            // HH:mm
  intervaloMinutos: number;      // 15, 30, 45, 60, etc.
  duracionMinimaMinutos: number;
  duracionMaximaMinutos: number;
  diasOperativos: string;        // "1,2,3,4,5" (Lunes a Viernes)
}

export interface SlotsDisponibilidadResponseDTO {
  fecha: string;               // YYYY-MM-DD
  espacioId: number;
  espacioNombre: string;
  configuracion: ConfiguracionOperativaDTO;
  slots: TimeSlot[];
  resumen: {
    totalSlots: number;
    disponibles: number;
    ocupados: number;
    bloqueados: number;
  };
}
