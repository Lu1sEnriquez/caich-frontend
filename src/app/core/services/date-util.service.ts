import { Injectable } from '@angular/core';

/**
 * Servicio centralizado para manejo de fechas y formatos
 * Proporciona métodos consistentes para convertir fechas a formatos esperados por la API
 */
@Injectable({
  providedIn: 'root',
})
export class DateUtilService {
  /**
   * Convierte una Date a string ISO local (sin convertir a UTC)
   * Formato: YYYY-MM-DDTHH:mm:ss
   *
   * Ejemplo:
   * - Input: new Date(2025, 10, 23, 14, 30, 45)
   * - Output: "2025-11-23T14:30:45"
   *
   * Usar este método cuando el backend espere la hora local del usuario,
   * NO la hora UTC
   */
  toLocalISOString(date: Date): string {
    if (!date || !(date instanceof Date)) {
      console.warn('DateUtilService: Fecha inválida', date);
      return '';
    }

    const pad = (n: number) => String(n).padStart(2, '0');

    return (
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
      `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    );
  }

  /**
   * Convierte una Date a fecha ISO simple (sin hora)
   * Formato: YYYY-MM-DD
   *
   * Ejemplo:
   * - Input: new Date(2025, 10, 23)
   * - Output: "2025-11-23"
   */
  toDateString(date: Date): string {
    if (!date || !(date instanceof Date)) {
      console.warn('DateUtilService: Fecha inválida', date);
      return '';
    }

    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  /**
   * Convierte una Date a hora simple (HH:mm)
   * Formato: HH:mm
   *
   * Ejemplo:
   * - Input: new Date(2025, 10, 23, 14, 30, 45)
   * - Output: "14:30"
   */
  toTimeString(date: Date): string {
    if (!date || !(date instanceof Date)) {
      console.warn('DateUtilService: Fecha inválida', date);
      return '';
    }

    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  /**
   * Convierte una Date a ISO string UTC (formato estándar)
   * Formato: YYYY-MM-DDTHH:mm:ss.000Z
   *
   * Usar este método cuando el backend espere UTC
   */
  toUTCISOString(date: Date): string {
    if (!date || !(date instanceof Date)) {
      console.warn('DateUtilService: Fecha inválida', date);
      return '';
    }

    return date.toISOString();
  }

  /**
   * Parsea una fecha en formato YYYY-MM-DD a Date
   * Asume hora local a las 00:00:00
   */
  parseDate(dateString: string): Date {
    if (!dateString) {
      console.warn('DateUtilService: String de fecha vacío');
      return new Date();
    }

    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /**
   * Parsea una fecha en formato YYYY-MM-DDTHH:mm:ss a Date
   */
  parseDateTime(dateTimeString: string): Date {
    if (!dateTimeString) {
      console.warn('DateUtilService: String de fecha-hora vacío');
      return new Date();
    }

    return new Date(dateTimeString);
  }

  /**
   * Formatea una Date para mostrar en UI (locale: es-MX)
   * Ejemplo: "domingo, 23 de noviembre de 2025"
   */
  formatDisplayDate(date: Date): string {
    if (!date || !(date instanceof Date)) {
      return '';
    }

    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Formatea una Date-Time para mostrar en UI (locale: es-MX)
   * Ejemplo: "23/11/2025 14:30"
   */
  formatDisplayDateTime(date: Date): string {
    if (!date || !(date instanceof Date)) {
      return '';
    }

    const dateStr = date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const timeStr = date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    return `${dateStr} ${timeStr}`;
  }
}
