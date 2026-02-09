// ============================================
// MODELOS DE LA APLICACIÓN
// ============================================
// Modelos que usa el frontend, mapeados desde la API

import {
  UserRole,
  UserStatus,
  TicketStatus,
  PaymentStatus,
  SpaceType,
  ProductCategory,
  LoanStatus,
  ProductUsageType,
  NotificationType,
} from './enums';

// ============================================
// USUARIOS
// ============================================

export interface User {
  id: string;
  nombreCompleto: string;
  email: string;
  folio?: string;
  idAlumno?: string;
  telefono?: string;
  rol: UserRole;
  estado: UserStatus;
  foto?: string;
  ultimaConexion?: Date;
  fechaCreacion?: Date;
}

export interface AuthUser {
  id: string;
  nombreCompleto: string;
  email: string;
  rol: UserRole;
  foto?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombreCompleto: string;
  email: string;
  folio?: string;
  idAlumno?: string;
  password: string;
  telefono?: string;
  rol: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  type: string;
  usuarioId: number;
  nombreCompleto: string;
  email: string;
  rol: UserRole;
  expiresIn: number;
}

// ============================================
// TICKETS / CITAS
// ============================================

export interface Payment {
  id: string;
  nombre: string;
  email?: string;
  folio: string;
  banco?: string;
  concepto?: string;
  monto: number;
  status: PaymentStatus;
  fechaPago: Date;
  fechaRegistro: Date;
  comprobante?: string;
  citaFecha?: Date;
}

export interface Ticket {
  ticketId: number;
  folio: string;
  fecha: Date;
  duracion?: number;

  // Relaciones
  pacienteId: number;
  pacienteNombre: string;
  pacienteEmail?: string;

  terapeutaId: number;
  terapeutaNombre: string;
  terapeutaEmail?: string;

  espacioId?: number;
  espacioNombre?: string;

  cuentaDestinoId: number;

  // Información
  materia: string;
  conceptoIngreso?: string;
  conceptoTransferencia?: string;
  notas?: string;

  // Datos de pago
  montoPagado: number;
  celular?: string;

  // Costos
  costoEspacio: number;
  costoMateriales: number;
  costoAdicional: number;
  costoTotal: number;

  // Estados
  estadoTicket: TicketStatus;
  estadoPago: PaymentStatus;

  // Auditoría
  creadoPorId?: number;
  fechaCreacion: Date;
  ultimaActualizacion?: Date;

  // Detalles de productos
  detalles?: TicketDetalle[];
}

export interface TicketDetalle {
  detalleId: number;
  ticketId: number;
  productoId: number;
  productoNombre: string;
  productoCodigo: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  tipoUso: ProductUsageType;
}

// ============================================
// ESPACIOS
// ============================================

export interface Espacio {
  espacioId: number;
  nombre: string;
  tipo: SpaceType;
  descripcion?: string;
  capacidad: number;
  costoPorHora: number;
  estaActivo: boolean;
  fechaCreacion?: Date;
}

// ============================================
// PRODUCTOS / INVENTARIO
// ============================================

export interface Producto {
  productoId: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: ProductCategory;
  precio: number;
  stock: number;
  stockMinimo: number;
  esVendible: boolean;
  esPrestable: boolean;
  estaActivo: boolean;
  fechaCreacion?: Date;
}

export interface MovimientoInventario {
  movimientoId: number;
  productoId: number;
  tipoMovimiento: 'Entrada' | 'Salida' | 'Ajuste' | 'Devolucion';
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  motivo?: string;
  referencia?: string;
  realizadoPorId?: number;
  fechaMovimiento: Date;
}

// ============================================
// PRÉSTAMOS
// ============================================

export interface PrestamoMaterial {
  prestamoId: number;
  ticketId?: number;
  alumnoId: number;
  alumnoNombre: string;
  productoId: number;
  productoNombre: string;
  fechaPrestamo: Date;
  fechaDevolucionEstimada: Date;
  fechaDevolucionReal?: Date;
  cantidad: number;
  estadoPrestamo: LoanStatus;
  observaciones?: string;
  diasVencidos?: number;
}

// ============================================
// NOTIFICACIONES
// ============================================

export interface Notificacion {
  notificacionId: number;
  usuarioId: number;
  tipo: NotificationType;
  titulo: string;
  mensaje: string;
  leida: boolean;
  fechaLeida?: Date;
  referenciaId?: number;
  referenciaUrl?: string;
  fechaCreacion: Date;
}

// ============================================
// CUENTAS BANCARIAS
// ============================================

export interface CuentaBancaria {
  cuentaId: number;
  banco: string;
  numeroCuenta: string;
  clabe?: string;
  titular: string;
  estaActiva: boolean;
  fechaCreacion?: Date;
}

export interface BankAccount {
  id: string;
  banco: string;
  numeroCuenta: string;
  clabe: string;
  titular: string;
  activo: boolean;
}

export interface SavedPaymentMethod {
  id: string;
  tipo: string;
  nombre: string;
  ultimos4: string;
  vencimiento?: string;
  porDefecto: boolean;
}

// ============================================
// HORARIOS Y CONFIGURACIÓN
// ============================================

export interface HorarioDisponible {
  horarioId: number;
  diaSemana: number; // 0=Domingo, 6=Sábado
  horaInicio: string; // "09:00"
  horaFin: string; // "17:00"
  estaActivo: boolean;
}

export interface BloqueoHorario {
  bloqueoId: number;
  espacioId?: number;
  fechaInicio: Date;
  fechaFin: Date;
  motivo?: string;
  todoElDia: boolean;
  creadoPorId?: number;
  fechaCreacion: Date;
}

export interface ConfiguracionEspacioHorario {
  configId: number;
  espacioId: number;
  fecha: Date;
  horaInicio: string;
  horaFin?: string;
  estaDisponible: boolean;
  fechaCreacion: Date;
}

// ============================================
// AUDITORÍA
// ============================================

export interface HistorialCambio {
  cambioId: number;
  entidad: string;
  entidadId: number;
  accion: 'Crear' | 'Actualizar' | 'Eliminar';
  camposModificados?: string;
  valoresAnteriores?: string;
  valoresNuevos?: string;
  usuarioId?: number;
  usuarioNombre?: string;
  fechaCambio: Date;
  direccionIP?: string;
}

// ============================================
// REPORTES Y ESTADÍSTICAS
// ============================================

export interface DashboardStats {
  citasHoy: number;
  pagosPendientes: number;
  nuevosPacientes: number;
  citasEsteMes: number;
  prestamosActivos: number;
  prestamosVencidos: number;
  productosStockBajo: number;
  productosSinStock: number;
  ingresosMes: number;
}

export interface TicketReporte {
  folio: string;
  fecha: Date;
  pacienteNombre: string;
  terapeutaNombre: string;
  materia: string;
  costoTotal: number;
  estadoTicket: TicketStatus;
  estadoPago: PaymentStatus;
}

export interface PaymentSummary {
  pendientes: number;
  aprobados: number;
  rechazados: number;
  totalPendiente: number;
}

// ============================================
// APPOINTMENTS
// ============================================

export interface Appointment {
  id: string;
  fecha: Date;
  hora: string;
  pacienteId: string;
  pacienteNombre: string;
  terapeutaId: string;
  terapeutaNombre: string;
  modalidad: string;
  status: string;
}

// ============================================
// UI / HELPERS
// ============================================

export interface MenuItem {
  label: string;
  route?: string;
  icon?: string;
  badge?: string | number;
  children?: MenuItem[];
}

export interface MenuGroup {
  title: string;
  items: MenuItem[];
}

export interface CalendarDay {
  date: Date;
  day: number;
  slots: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected?: boolean;
}

export interface TimeSlot {
  time: string;
  status: 'Disponible' | 'Ocupado';
}

export interface AppointmentSlot {
  id: string;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  cubiculoId: string;
  espacioNombre?: string;
  pacienteId: number; // nuevo
  pacienteNombre: string;
  terapeutaId: number; // nuevo
  terapeutaNombre: string;
  estado: 'Agendado' | 'Completado' | 'Cancelado' | 'NoAsistio';
  notas?: string;
  modalidad?: 'Presencial' | 'Online';
  materia?: string;
}

export interface Cubiculo {
  id: string;
  nombre: string;
  tipo: string;
  disponible: boolean;
  costoPorHora?: number;
}

export interface DayScheduleConfig {
  fecha: Date;
  horaInicio: number;
  horaFin: number;
  intervalo: number;
  horasDeshabilitadas: string[];
  esHorarioDefault: boolean;
}

// ============================================
// FILTROS Y PAGINACIÓN
// ============================================

export interface FilterOptions {
  estado?: string;
  montoMin?: number;
  montoMax?: number;
  paciente?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface PaginationParams {
  page: number;
  size: number;
  sortBy?: string;
  direction?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface TicketFilters {
  pacienteId?: number;
  terapeutaId?: number;
  estadoTicket?: TicketStatus;
  estadoPago?: PaymentStatus;
  fechaInicio?: string;
  fechaFin?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'asc' | 'desc';
}

export interface UserFilters {
  rol?: UserRole;
  estado?: UserStatus;
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'asc' | 'desc';
}
