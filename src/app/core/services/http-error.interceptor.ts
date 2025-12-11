import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorHandlerService } from './errorHandler.service';

/**
 * Interceptor global para manejar errores HTTP
 * Centraliza toda la lógica de manejo de errores para no repetir código
 * en cada servicio
 *
 * Beneficios:
 * - Una única ubicación para cambiar comportamiento de errores
 * - Manejo consistente de errores en toda la app
 * - Reduce código duplicado
 */
@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(private errorHandler: ErrorHandlerService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Extracto el mensaje del backend si existe
        const backendMessage = this.extractErrorMessage(error);

        // Log para debugging
        console.error('❌ [HTTP Error]', {
          status: error.status,
          statusText: error.statusText,
          message: backendMessage,
          url: req.url,
          timestamp: new Date().toISOString(),
        });

        // Manejo por tipo de error
        this.handleError(error, backendMessage);

        // Re-throw el error para que el subscriber pueda manejarlo si quiere
        return throwError(() => ({
          ...error,
          friendlyMessage: backendMessage,
        }));
      })
    );
  }

  /**
   * Extrae el mensaje de error del response del backend
   * Intenta múltiples caminos comunes para encontrar el mensaje
   */
  private extractErrorMessage(error: HttpErrorResponse): string {
    // Intentar obtener el mensaje del error
    if (error.error?.message) {
      return error.error.message;
    }

    // Si error.error es un string directamente
    if (typeof error.error === 'string') {
      return error.error;
    }

    // Si hay descripción del error
    if (error.error?.description) {
      return error.error.description;
    }

    // Fallback: usar el statusText de HTTP
    if (error.statusText) {
      return error.statusText;
    }

    return 'Error desconocido en el servidor';
  }

  /**
   * Maneja el error según su tipo y status code
   */
  private handleError(error: HttpErrorResponse, message: string): void {
    switch (error.status) {
      case 400:
        // Bad Request - Error de validación
        console.warn('⚠️ Error de validación (400):', message);
        this.errorHandler.showWarning('Datos inválidos', message);
        break;

      case 401:
        // Unauthorized - Token expirado o no válido
        console.warn('🔐 No autorizado (401)');
        this.errorHandler.showError(
          'Sesión expirada',
          'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
        );
        // Aquí se podría forzar logout
        break;

      case 403:
        // Forbidden - Sin permisos
        console.warn('🚫 Acceso denegado (403)');
        this.errorHandler.showError(
          'Acceso denegado',
          'No tienes permisos para realizar esta acción.'
        );
        break;

      case 404:
        // Not Found
        console.warn('🔍 Recurso no encontrado (404):', message);
        this.errorHandler.showWarning('No encontrado', message);
        break;

      case 409:
        // Conflict - Conflicto (ej: recurso ya existe)
        console.warn('⚡ Conflicto (409):', message);
        this.errorHandler.showWarning('Conflicto', message);
        break;

      case 500:
        // Internal Server Error
        console.error('🔴 Error del servidor (500)');
        this.errorHandler.showError(
          'Error del servidor',
          'Algo salió mal en el servidor. Por favor, intenta más tarde.'
        );
        break;

      case 503:
        // Service Unavailable
        console.error('🟠 Servicio no disponible (503)');
        this.errorHandler.showError(
          'Servicio no disponible',
          'El servidor está en mantenimiento. Intenta más tarde.'
        );
        break;

      default:
        // Otros errores
        console.error(`❌ Error HTTP ${error.status}:`, message);
        if (error.status === 0) {
          this.errorHandler.showError(
            'Error de conexión',
            'No se pudo conectar al servidor. Verifica tu conexión a internet.'
          );
        } else {
          this.errorHandler.showError('Error', message);
        }
    }
  }
}
