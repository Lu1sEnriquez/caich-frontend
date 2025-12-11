/**
 * Utilidades de formateo para toda la aplicación
 * Centraliza funciones de formateo de fechas, montos, etc.
 */

import { DateUtilService } from '../services/date-util.service';

/**
 * Formatea una fecha para mostrar en la UI
 * @param date - Fecha a formatear
 * @returns String con formato "DD/MM/YYYY"
 */
export function formatDisplayDate(date: Date | string): string {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Formatea una fecha para mostrar con hora
 * @param date - Fecha a formatear
 * @returns String con formato "DD/MM/YYYY HH:mm"
 */
export function formatDatetime(date: Date | string): string {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formatea una fecha para usar en input type="date"
 * @param date - Fecha a formatear
 * @returns String con formato "YYYY-MM-DD"
 */
export function formatDateForInput(date: Date | string): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formatea un monto de dinero con símbolo de moneda
 * @param monto - Monto a formatear
 * @param currency - Símbolo de moneda (default: $)
 * @param decimals - Cantidad de decimales (default: 2)
 * @returns String formateado "$ 1,234.56"
 */
export function formatMonto(monto: number, currency = '$', decimals = 2): string {
  if (isNaN(monto)) return `${currency} 0.00`;
  return `${currency} ${monto.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/**
 * Formatea un porcentaje
 * @param value - Valor a formatear
 * @param decimals - Cantidad de decimales (default: 1)
 * @returns String formateado "85.5%"
 */
export function formatPercent(value: number, decimals = 1): string {
  if (isNaN(value)) return '0.0%';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formatea un número con separadores de miles
 * @param value - Valor a formatear
 * @param decimals - Cantidad de decimales
 * @returns String formateado "1,234,567"
 */
export function formatNumber(value: number, decimals?: number): string {
  if (isNaN(value)) return '0';
  const formatted = decimals !== undefined ? value.toFixed(decimals) : String(value);
  return formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Trunca un texto a una longitud máxima
 * @param text - Texto a truncar
 * @param maxLength - Longitud máxima
 * @param suffix - Sufijo a añadir (default: "...")
 * @returns String truncado
 */
export function truncateText(text: string, maxLength: number, suffix = '...'): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + suffix;
}

/**
 * Capitaliza la primera letra de un string
 * @param text - Texto a capitalizar
 * @returns String capitalizado
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Convierte un string a título (capitaliza cada palabra)
 * @param text - Texto a convertir
 * @returns String en formato título
 */
export function toTitleCase(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Genera un resumen de texto
 * @param text - Texto a resumir
 * @param maxWords - Cantidad máxima de palabras
 * @returns String resumido
 */
export function summarizeText(text: string, maxWords = 20): string {
  if (!text) return '';
  const words = text.split(' ');
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '...';
}
