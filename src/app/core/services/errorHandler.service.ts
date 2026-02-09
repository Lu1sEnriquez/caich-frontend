import { Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

export interface ErrorModal {
  id: string;
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
  timestamp: Date;
}

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {
  // Signal para almacenar errores activos
  private errorsSignal = signal<ErrorModal[]>([]);

  // Exposición readonly
  errors = this.errorsSignal.asReadonly();

  /**
   * Muestra un error al usuario
   */
  showError(title: string, message: string): void {
    this.addError({
      id: this.generateId(),
      title,
      message,
      type: 'error',
      timestamp: new Date(),
    });
  }

  /**
   * Muestra una advertencia al usuario
   */
  showWarning(title: string, message: string): void {
    this.addError({
      id: this.generateId(),
      title,
      message,
      type: 'warning',
      timestamp: new Date(),
    });
  }

  /**
   * Muestra un mensaje informativo
   */
  showInfo(title: string, message: string): void {
    this.addError({
      id: this.generateId(),
      title,
      message,
      type: 'info',
      timestamp: new Date(),
    });
  }

  /**
   * Muestra un mensaje de éxito
   */
  showSuccess(title: string, message: string): void {
    this.addError({
      id: this.generateId(),
      title,
      message,
      type: 'success',
      timestamp: new Date(),
    });
  }

  /**
   * Maneja errores HTTP y los convierte en mensajes amigables
   */
  handleHttpError(error: HttpErrorResponse, context?: string): void {
    let title = 'Error';
    let message = 'Ocurrió un error inesperado';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      title = 'Error de conexión';
      message = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
    } else {
      // Error del lado del servidor
      title = context ? `Error en ${context}` : 'Error del servidor';

      // Intentar extraer el mensaje del servidor
      if (error.error?.message) {
        message = error.error.message;
      } else if (error.message) {
        message = error.message;
      } else {
        switch (error.status) {
          case 0:
            message = 'No se pudo conectar con el servidor';
            break;
          case 400:
            message = 'Datos inválidos. Verifica la información enviada.';
            break;
          case 401:
            message = 'No autorizado. Inicia sesión nuevamente.';
            break;
          case 403:
            message = 'No tienes permisos para realizar esta acción.';
            break;
          case 404:
            message = 'El recurso solicitado no fue encontrado.';
            break;
          case 500:
            message = 'Error interno del servidor. Intenta más tarde.';
            break;
          case 503:
            message = 'El servidor no está disponible. Intenta más tarde.';
            break;
          default:
            message = `Error ${error.status}: ${error.statusText}`;
        }
      }
    }

    this.showError(title, message);

    // Log detallado para desarrollo
    console.error('Error HTTP:', {
      status: error.status,
      statusText: error.statusText,
      message: error.message,
      error: error.error,
      url: error.url,
      context,
    });
  }

  /**
   * Cierra un error específico
   */
  closeError(id: string): void {
    this.errorsSignal.update((errors) => errors.filter((e) => e.id !== id));
  }

  /**
   * Cierra todos los errores
   */
  clearAll(): void {
    this.errorsSignal.set([]);
  }

  /**
   * Agrega un error a la cola
   */
  private addError(error: ErrorModal): void {
    this.errorsSignal.update((errors) => [...errors, error]);

    // Auto-cerrar después de 10 segundos
    setTimeout(() => {
      this.closeError(error.id);
    }, 10000);
  }

  /**
   * Genera un ID único
   */
  private generateId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
