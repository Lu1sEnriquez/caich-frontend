import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { API_BASE } from './api.config';

import { DataResponseDTO, BaseResponseDTO, NotificacionDTO } from '../models/api-models';
import { NotificationType } from '../models/enums';
import { ErrorHandlerService } from './errorHandler.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private http = inject(HttpClient);
  private errorHandler = inject(ErrorHandlerService);

  /**
   * Obtener todas las notificaciones del usuario actual
   */
  getAllNotifications(limite?: number): Observable<DataResponseDTO<NotificacionDTO[]>> {
    let params = new HttpParams();
    if (limite !== undefined && limite !== null) {
      params = params.set('limite', String(limite));
    }

    return this.http
      .get<DataResponseDTO<NotificacionDTO[]>>(`${API_BASE}/notificaciones`, { params })
      .pipe(
        tap((response) =>
          console.log('✅ Notificaciones obtenidas:', response.data.length, 'registros')
        ),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Obtener notificaciones');
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener notificaciones no leídas
   */
  getUnreadNotifications(): Observable<DataResponseDTO<NotificacionDTO[]>> {
    return this.http
      .get<DataResponseDTO<NotificacionDTO[]>>(`${API_BASE}/notificaciones/no-leidas`)
      .pipe(
        tap((response) => console.log('✅ Notificaciones no leídas:', response.data.length)),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Obtener notificaciones no leídas');
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener contador de notificaciones no leídas
   */
  getUnreadCount(): Observable<DataResponseDTO<number>> {
    return this.http
      .get<DataResponseDTO<number>>(`${API_BASE}/notificaciones/contador-no-leidas`)
      .pipe(
        tap((response) => console.log('✅ Contador de no leídas:', response.data)),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Obtener contador');
          return throwError(() => error);
        })
      );
  }

  /**
   * Marcar notificación como leída
   */
  markAsRead(notificacionId: number | string): Observable<BaseResponseDTO> {
    return this.http
      .post<BaseResponseDTO>(`${API_BASE}/notificaciones/${notificacionId}/marcar-leida`, null)
      .pipe(
        tap(() => console.log('✅ Notificación marcada como leída')),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Marcar como leída');
          return throwError(() => error);
        })
      );
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  markAllAsRead(): Observable<DataResponseDTO<number>> {
    return this.http
      .post<DataResponseDTO<number>>(`${API_BASE}/notificaciones/marcar-todas-leidas`, null)
      .pipe(
        tap((response) => {
          console.log('✅ Todas las notificaciones marcadas como leídas');
          this.errorHandler.showSuccess(
            'Notificaciones leídas',
            `Se marcaron ${response.data} notificaciones como leídas`
          );
        }),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Marcar todas como leídas');
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener notificaciones por tipo
   */
  getNotificationsByType(tipo: NotificationType): Observable<DataResponseDTO<NotificacionDTO[]>> {
    const params = new HttpParams().set('tipo', tipo);

    return this.http
      .get<DataResponseDTO<NotificacionDTO[]>>(`${API_BASE}/notificaciones`, { params })
      .pipe(
        tap((response) => console.log('✅ Notificaciones por tipo:', response.data.length)),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Obtener notificaciones por tipo');
          return throwError(() => error);
        })
      );
  }

  /**
   * Eliminar notificación
   */
  deleteNotification(notificacionId: number | string): Observable<BaseResponseDTO> {
    return this.http.delete<BaseResponseDTO>(`${API_BASE}/notificaciones/${notificacionId}`).pipe(
      tap(() => {
        console.log('✅ Notificación eliminada');
        this.errorHandler.showSuccess('Notificación eliminada', 'Se eliminó correctamente');
      }),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Eliminar notificación');
        return throwError(() => error);
      })
    );
  }

  /**
   * Eliminar todas las notificaciones leídas
   */
  deleteAllRead(): Observable<DataResponseDTO<number>> {
    return this.http
      .delete<DataResponseDTO<number>>(`${API_BASE}/notificaciones/eliminar-leidas`)
      .pipe(
        tap((response) => {
          console.log('✅ Notificaciones leídas eliminadas');
          this.errorHandler.showSuccess(
            'Notificaciones eliminadas',
            `Se eliminaron ${response.data} notificaciones`
          );
        }),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Eliminar notificaciones leídas');
          return throwError(() => error);
        })
      );
  }

  /**
   * Crear notificación manual (Admin)
   */
  createNotification(notificationData: {
    usuarioId: number;
    tipo: NotificationType;
    titulo: string;
    mensaje: string;
    referenciaUrl?: string;
  }): Observable<DataResponseDTO<NotificacionDTO>> {
    //TODO: Implementar endpoint POST /notificaciones en la API
    console.warn('⚠️ createNotification: Endpoint pendiente en la API');

    return this.http
      .post<DataResponseDTO<NotificacionDTO>>(`${API_BASE}/notificaciones`, notificationData)
      .pipe(
        tap(() => {
          console.log('✅ Notificación creada');
          this.errorHandler.showSuccess(
            'Notificación enviada',
            'La notificación se envió correctamente'
          );
        }),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Crear notificación');
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener estadísticas de notificaciones
   */
  getNotificationStats(): Observable<{
    total: number;
    noLeidas: number;
    porTipo: Record<NotificationType, number>;
  }> {
    //TODO: Implementar endpoint GET /notificaciones/stats en la API
    console.warn('⚠️ getNotificationStats: Endpoint pendiente en la API');

    return this.http.get<any>(`${API_BASE}/notificaciones/stats`).pipe(
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Obtener estadísticas de notificaciones');
        return throwError(() => error);
      })
    );
  }
}
