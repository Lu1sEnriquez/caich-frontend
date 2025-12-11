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
  pacienteNombre?: string;
  terapeutaNombre?: string;
  espacioNombre?: string;
  costoTotal?: number;
  estadoTicket?: string;
  estadoPago?: string;
  detalles?: TicketDetalleDTO[];
}

export interface TicketFiltroDTO extends TicketDTO {
  pacienteEmail: string;
  terapeutaEmail: string;
  materia: string;
  fechaCreacion: string;
}

export interface Producto {
  productoId?: number;
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  categoria?: string;
  precio?: number;
  stock?: number;
  stockMinimo?: number;
  esVendible?: boolean;
  esPrestable?: boolean;
}

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
  notas:           string;
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


