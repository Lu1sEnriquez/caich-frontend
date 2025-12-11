import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { API_BASE } from './api.config';

import { DataResponseDTO, BaseResponseDTO, PrestamoDTO } from '../models/api-models';
import { LoanStatus } from '../models/enums';
import { ErrorHandlerService } from './errorHandler.service';

export interface CrearPrestamoRequest {
  ticketId?: number;
  alumnoId: number;
  productoId: number;
  fechaPrestamo: string; // ISO format
  fechaDevolucionEstimada: string; // ISO format
  cantidad: number;
  observaciones?: string;
}

export interface ActualizarPrestamoRequest {
  fechaDevolucionEstimada?: string;
  observaciones?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LoansService {
  private http = inject(HttpClient);
  private errorHandler = inject(ErrorHandlerService);

  /**
   * Obtener todos los préstamos
   */
  getAllLoans(estado?: LoanStatus): Observable<DataResponseDTO<PrestamoDTO[]>> {
    let params = new HttpParams();
    if (estado) params = params.set('estado', estado);

    return this.http.get<DataResponseDTO<PrestamoDTO[]>>(`${API_BASE}/prestamos`, { params }).pipe(
      tap((response) => console.log('✅ Préstamos obtenidos:', response.data.length, 'registros')),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Obtener préstamos');
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener préstamo por ID
   */
  getLoanById(prestamoId: number | string): Observable<DataResponseDTO<PrestamoDTO>> {
    return this.http.get<DataResponseDTO<PrestamoDTO>>(`${API_BASE}/prestamos/${prestamoId}`).pipe(
      tap((response) => console.log('✅ Préstamo obtenido:', response.data.prestamoId)),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Obtener préstamo');
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener préstamos de un alumno
   */
  getLoansByStudent(alumnoId: number | string): Observable<DataResponseDTO<PrestamoDTO[]>> {
    return this.http
      .get<DataResponseDTO<PrestamoDTO[]>>(`${API_BASE}/prestamos/alumno/${alumnoId}`)
      .pipe(
        tap((response) => console.log('✅ Préstamos del alumno:', response.data.length)),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Obtener préstamos del alumno');
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener préstamos activos de un alumno
   */
  getActiveLoansByStudent(alumnoId: number | string): Observable<DataResponseDTO<PrestamoDTO[]>> {
    return this.http
      .get<DataResponseDTO<PrestamoDTO[]>>(`${API_BASE}/prestamos/alumno/${alumnoId}`)
      .pipe(
        tap((response) => {
          const activos = response.data.filter((p) => p.estadoPrestamo === 'Activo');
          console.log('✅ Préstamos activos del alumno:', activos.length);
        }),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Obtener préstamos activos');
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener préstamos vencidos
   */
  getOverdueLoans(): Observable<DataResponseDTO<PrestamoDTO[]>> {
    return this.http
      .get<DataResponseDTO<PrestamoDTO[]>>(`${API_BASE}/prestamos?estado=Vencido`)
      .pipe(
        tap((response) => {
          console.log('✅ Préstamos vencidos:', response.data.length);
          if (response.data.length > 0) {
            this.errorHandler.showWarning(
              'Préstamos vencidos',
              `Hay ${response.data.length} préstamos vencidos`
            );
          }
        }),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Obtener préstamos vencidos');
          return throwError(() => error);
        })
      );
  }

  /**
   * Crear nuevo préstamo
   */
  createLoan(loanData: CrearPrestamoRequest): Observable<DataResponseDTO<PrestamoDTO>> {
    return this.http.post<DataResponseDTO<PrestamoDTO>>(`${API_BASE}/prestamos`, loanData).pipe(
      tap((response) => {
        console.log('✅ Préstamo creado:', response.data.prestamoId);
        this.errorHandler.showSuccess(
          'Préstamo registrado',
          'El préstamo se registró exitosamente'
        );
      }),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Crear préstamo');
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualizar préstamo
   */
  updateLoan(
    prestamoId: number | string,
    loanData: ActualizarPrestamoRequest
  ): Observable<DataResponseDTO<PrestamoDTO>> {
    return this.http
      .put<DataResponseDTO<PrestamoDTO>>(`${API_BASE}/prestamos/${prestamoId}`, loanData)
      .pipe(
        tap(() => {
          console.log('✅ Préstamo actualizado');
          this.errorHandler.showSuccess('Préstamo actualizado', 'Los cambios se guardaron');
        }),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Actualizar préstamo');
          return throwError(() => error);
        })
      );
  }

  /**
   * Devolver préstamo
   */
  returnLoan(
    prestamoId: number | string,
    observaciones?: string
  ): Observable<DataResponseDTO<PrestamoDTO>> {
    let params = new HttpParams();
    if (observaciones) params = params.set('observaciones', observaciones);

    return this.http
      .post<DataResponseDTO<PrestamoDTO>>(`${API_BASE}/prestamos/${prestamoId}/devolver`, null, {
        params,
      })
      .pipe(
        tap(() => {
          console.log('✅ Préstamo devuelto');
          this.errorHandler.showSuccess(
            'Material devuelto',
            'El material se devolvió correctamente'
          );
        }),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Devolver material');
          return throwError(() => error);
        })
      );
  }

  /**
   * Marcar préstamo como perdido
   */
  markAsLost(prestamoId: number | string, observaciones: string): Observable<BaseResponseDTO> {
    const params = new HttpParams().set('observaciones', observaciones);

    return this.http
      .post<BaseResponseDTO>(`${API_BASE}/prestamos/${prestamoId}/marcar-perdido`, null, {
        params,
      })
      .pipe(
        tap(() => {
          console.log('✅ Préstamo marcado como perdido');
          this.errorHandler.showWarning('Material perdido', 'El material se marcó como perdido');
        }),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Marcar como perdido');
          return throwError(() => error);
        })
      );
  }

  /**
   * Eliminar préstamo (solo si no ha sido devuelto)
   */
  deleteLoan(prestamoId: number | string): Observable<BaseResponseDTO> {
    return this.http.delete<BaseResponseDTO>(`${API_BASE}/prestamos/${prestamoId}`).pipe(
      tap(() => {
        console.log('✅ Préstamo eliminado');
        this.errorHandler.showSuccess('Préstamo eliminado', 'El registro se eliminó');
      }),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Eliminar préstamo');
        return throwError(() => error);
      })
    );
  }

  /**
   * Extender fecha de devolución
   */
  extendDueDate(
    prestamoId: number | string,
    nuevaFecha: string,
    motivo: string
  ): Observable<DataResponseDTO<PrestamoDTO>> {
    const body = {
      fechaDevolucionEstimada: nuevaFecha,
      observaciones: motivo,
    };

    return this.http
      .put<DataResponseDTO<PrestamoDTO>>(`${API_BASE}/prestamos/${prestamoId}`, body)
      .pipe(
        tap(() => {
          console.log('✅ Fecha de devolución extendida');
          this.errorHandler.showSuccess('Plazo extendido', 'Se actualizó la fecha de devolución');
        }),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Extender plazo');
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener estadísticas de préstamos
   */
  getLoanStats(): Observable<{
    total: number;
    activos: number;
    vencidos: number;
    devueltos: number;
    perdidos: number;
  }> {
    //TODO: Implementar endpoint GET /prestamos/stats en la API
    // Response esperado: { total, activos, vencidos, devueltos, perdidos }
    console.warn('⚠️ getLoanStats: Endpoint pendiente en la API');

    return this.http.get<any>(`${API_BASE}/prestamos/stats`).pipe(
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Obtener estadísticas de préstamos');
        return throwError(() => error);
      })
    );
  }
}
