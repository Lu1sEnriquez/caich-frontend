/**
 * Constantes globales de la aplicación
 * Centraliza configuraciones, límites, rutas, etc.
 */

// ============================================
// API CONFIGURATION
// ============================================

/**
 * URL base de la API
 */
export const API_BASE = 'http://localhost:8080/api';

/**
 * Timeout de solicitudes HTTP (ms)
 */
export const HTTP_TIMEOUT = 30000;

/**
 * Reintentos de solicitudes HTTP
 */
export const HTTP_MAX_RETRIES = 3;

/**
 * Intervalo entre reintentos (ms)
 */
export const HTTP_RETRY_INTERVAL = 1000;

// ============================================
// STORAGE KEYS
// ============================================

/**
 * Claves para localStorage
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  CURRENT_USER: 'current_user',
  THEME: 'theme_preference',
  LANGUAGE: 'language_preference',
} as const;

// ============================================
// FILE UPLOAD CONSTRAINTS
// ============================================

/**
 * Restricciones para carga de archivos
 */
export const FILE_UPLOAD_CONSTRAINTS = {
  MAX_SIZE_MB: 10,
  ALLOWED_MIME_TYPES_DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ALLOWED_MIME_TYPES_IMAGES: ['image/jpeg', 'image/png', 'image/gif'],
  ALLOWED_MIME_TYPES_COMPROBANTE: ['application/pdf', 'image/jpeg', 'image/png'],
  ALLOWED_EXTENSIONS_COMPROBANTE: ['pdf', 'jpg', 'jpeg', 'png'],
} as const;

// ============================================
// PAGINATION
// ============================================

/**
 * Configuración de paginación
 */
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  ITEMS_PER_PAGE_OPTIONS: [5, 10, 25, 50],
} as const;

// ============================================
// TIMEOUTS
// ============================================

/**
 * Timeouts para operaciones específicas
 */
export const OPERATION_TIMEOUTS = {
  SHORT: 3000, // ms
  MEDIUM: 5000, // ms
  LONG: 10000, // ms
} as const;

// ============================================
// DATE FORMATS
// ============================================

/**
 * Formatos de fecha usados en la aplicación
 */
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY', // Para mostrar fechas
  DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm', // Para mostrar fechas con hora
  INPUT: 'YYYY-MM-DD', // Para inputs
  API: 'YYYY-MM-DDTHH:mm:ss', // Para API
} as const;

// ============================================
// CURRENCIES
// ============================================

/**
 * Configuración de monedas
 */
export const CURRENCY_CONFIG = {
  SYMBOL: '$',
  DECIMAL_PLACES: 2,
  THOUSAND_SEPARATOR: ',',
  DECIMAL_SEPARATOR: '.',
} as const;

// ============================================
// DASHBOARD
// ============================================

/**
 * Configuración del dashboard
 */
export const DASHBOARD_CONFIG = {
  STATS_REFRESH_INTERVAL: 60000, // ms (1 minuto)
  CHART_HEIGHT: 300, // px
} as const;

// ============================================
// CALENDAR
// ============================================

/**
 * Configuración del calendario
 */
export const CALENDAR_CONFIG = {
  FIRST_DAY_OF_WEEK: 0, // 0 = Domingo
  TIME_SLOT_INTERVAL: 30, // minutos
  WORKING_HOURS_START: 9, // 09:00
  WORKING_HOURS_END: 17, // 17:00
  MAX_APPOINTMENTS_PER_DAY: 20,
} as const;

// ============================================
// VALIDATION
// ============================================

/**
 * Validaciones por defecto
 */
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_NUMBER: true,
  PASSWORD_REQUIRE_SPECIAL_CHAR: false,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  EMAIL_MAX_LENGTH: 100,
  PHONE_MIN_LENGTH: 10,
} as const;

// ============================================
// NOTIFICATIONS
// ============================================

/**
 * Configuración de notificaciones
 */
export const NOTIFICATION_CONFIG = {
  AUTO_DISMISS_DURATION: 5000, // ms
  MAX_VISIBLE_NOTIFICATIONS: 5,
  POSITION: 'top-right', // top-right, top-left, bottom-right, bottom-left
} as const;

// ============================================
// ERROR MESSAGES
// ============================================

/**
 * Mensajes de error predefinidos
 */
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'Este campo es requerido',
  INVALID_EMAIL: 'Email inválido',
  INVALID_PHONE: 'Teléfono inválido',
  INVALID_PASSWORD: 'La contraseña debe tener al menos 8 caracteres, incluir una mayúscula y un número',
  PASSWORDS_NOT_MATCH: 'Las contraseñas no coinciden',
  INVALID_FILE: 'Archivo inválido',
  FILE_TOO_LARGE: `Archivo muy grande (máximo ${FILE_UPLOAD_CONSTRAINTS.MAX_SIZE_MB}MB)`,
  NETWORK_ERROR: 'Error de conexión. Por favor intente de nuevo',
  UNAUTHORIZED: 'No autorizado. Por favor inicie sesión',
  FORBIDDEN: 'No tiene permisos para realizar esta acción',
  NOT_FOUND: 'Recurso no encontrado',
  SERVER_ERROR: 'Error del servidor. Por favor intente más tarde',
  OPERATION_FAILED: 'La operación no se completó correctamente',
  UNKNOWN_ERROR: 'Ocurrió un error desconocido',
} as const;

// ============================================
// SUCCESS MESSAGES
// ============================================

/**
 * Mensajes de éxito predefinidos
 */
export const SUCCESS_MESSAGES = {
  CREATED: 'Creado exitosamente',
  UPDATED: 'Actualizado exitosamente',
  DELETED: 'Eliminado exitosamente',
  SAVED: 'Guardado exitosamente',
  OPERATION_COMPLETED: 'Operación completada',
  LOGIN_SUCCESS: 'Inicio de sesión exitoso',
  LOGOUT_SUCCESS: 'Cierre de sesión exitoso',
  FILE_UPLOADED: 'Archivo cargado exitosamente',
} as const;

// ============================================
// ROUTES
// ============================================

/**
 * Rutas principales de la aplicación
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  CALENDAR: '/calendario',
  PAYMENTS: '/pagos',
  USERS: '/usuarios',
  USER_DETAIL: '/usuarios/:id',
  PROFILE: '/perfil',
} as const;

// ============================================
// REGEX PATTERNS
// ============================================

/**
 * Patrones regex reutilizables
 */
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\d\s\-\+\(\)]{10,}$/,
  PASSWORD: /^(?=.*[A-Z])(?=.*\d).{8,}$/,
  URL: /^https?:\/\/.+\..+$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  NUMERIC: /^\d+$/,
  RFC: /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/,
  CURP: /^[A-Z]{4}\d{6}[HM][A-Z]{5}\d{3}$/,
} as const;

// ============================================
// COLORS
// ============================================

/**
 * Paleta de colores de la aplicación
 */
export const COLORS = {
  PRIMARY: '#3b82f6',
  SECONDARY: '#6f42c1',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  DANGER: '#ef4444',
  INFO: '#0ea5e9',
  LIGHT: '#f3f4f6',
  DARK: '#1f2937',
  GRAY: '#6b7280',
} as const;

// ============================================
// BADGE VARIANTS
// ============================================

/**
 * Variantes de badges
 */
export const BADGE_VARIANTS = {
  SUCCESS: 'success',
  WARNING: 'warning',
  DANGER: 'danger',
  INFO: 'info',
  SECONDARY: 'secondary',
  DEFAULT: 'default',
} as const;
