/**
 * Utilidades de validación para toda la aplicación
 * Centraliza validaciones de email, teléfono, archivos, etc.
 */

/**
 * Valida un email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida un teléfono (formato básico)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Valida una contraseña (mínimo 8 caracteres, 1 mayúscula, 1 número)
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password);
}

/**
 * Valida que un campo no esté vacío
 */
export function isNotEmpty(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * Valida un monto (número positivo)
 */
export function isValidAmount(amount: any): boolean {
  const num = Number(amount);
  return !isNaN(num) && num > 0;
}

/**
 * Valida un número positivo
 */
export function isPositiveNumber(value: any): boolean {
  const num = Number(value);
  return !isNaN(num) && num > 0;
}

/**
 * Valida un número entero positivo
 */
export function isPositiveInteger(value: any): boolean {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}

/**
 * Valida que una fecha sea válida y no esté en el pasado
 */
export function isFutureDate(date: Date): boolean {
  return new Date(date) > new Date();
}

/**
 * Valida que una fecha sea válida y no esté en el futuro
 */
export function isPastDate(date: Date): boolean {
  return new Date(date) < new Date();
}

/**
 * Valida que una fecha sea hoy o en el futuro
 */
export function isCurrentOrFutureDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(date) >= today;
}

/**
 * Valida que dos campos sean iguales
 */
export function matches(value1: any, value2: any): boolean {
  return value1 === value2;
}

/**
 * Valida que un valor esté dentro de un rango
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Valida que un array contenga un valor
 */
export function isInArray(value: any, array: any[]): boolean {
  return array.includes(value);
}

/**
 * Valida la extensión de un archivo
 */
export function isValidFileExtension(file: File, allowedExtensions: string[]): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  return allowedExtensions.map((ext) => ext.toLowerCase()).includes(extension);
}

/**
 * Valida el tipo MIME de un archivo
 */
export function isValidFileMimeType(file: File, allowedMimeTypes: string[]): boolean {
  return allowedMimeTypes.includes(file.type);
}

/**
 * Valida el tamaño de un archivo (en MB)
 */
export function isValidFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Valida un archivo completo (tipo, tamaño, extensión)
 */
export function isValidFile(
  file: File,
  options: {
    allowedMimeTypes?: string[];
    allowedExtensions?: string[];
    maxSizeMB?: number;
  }
): boolean {
  if (!file) return false;

  if (options.allowedMimeTypes && !isValidFileMimeType(file, options.allowedMimeTypes)) {
    return false;
  }

  if (options.allowedExtensions && !isValidFileExtension(file, options.allowedExtensions)) {
    return false;
  }

  if (options.maxSizeMB && !isValidFileSize(file, options.maxSizeMB)) {
    return false;
  }

  return true;
}

/**
 * Genera un mensaje de error de validación para un archivo
 */
export function getFileValidationError(
  file: File,
  options: {
    allowedMimeTypes?: string[];
    allowedExtensions?: string[];
    maxSizeMB?: number;
  }
): string | null {
  if (!file) return 'No se seleccionó archivo';

  if (options.allowedMimeTypes && !isValidFileMimeType(file, options.allowedMimeTypes)) {
    return `Tipo de archivo no permitido. Permitidos: ${options.allowedMimeTypes.join(', ')}`;
  }

  if (options.allowedExtensions && !isValidFileExtension(file, options.allowedExtensions)) {
    return `Extensión no permitida. Permitidas: ${options.allowedExtensions.join(', ')}`;
  }

  if (options.maxSizeMB && !isValidFileSize(file, options.maxSizeMB)) {
    return `Archivo muy grande. Máximo permitido: ${options.maxSizeMB}MB`;
  }

  return null;
}

/**
 * Valida un CLABE (18 dígitos)
 */
export function isValidCLABE(clabe: string): boolean {
  return /^\d{18}$/.test(clabe);
}

/**
 * Valida un número de cuenta bancaria (básico)
 */
export function isValidBankAccount(account: string): boolean {
  return /^\d{10,20}$/.test(account);
}

/**
 * Valida un RFC (básico)
 */
export function isValidRFC(rfc: string): boolean {
  return /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(rfc);
}

/**
 * Valida un CURP (básico)
 */
export function isValidCURP(curp: string): boolean {
  return /^[A-Z]{4}\d{6}[HM][A-Z]{5}\d{3}$/.test(curp);
}
