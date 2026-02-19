import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { API_BASE } from './api.config';

import {
  DataResponseDTO,
  PagoRequestDTO,
  PagoResponseDTO,
} from '../models/api-models';
import { CuentaBancaria } from '../models/models';
import { ErrorHandlerService } from './errorHandler.service';

@Injectable({
  providedIn: 'root',
})
export class PaymentsService {
  private http = inject(HttpClient);
  private errorHandler = inject(ErrorHandlerService);

  /**
   * Registrar pago
   */
  registerPayment(paymentData: PagoRequestDTO): Observable<DataResponseDTO<PagoResponseDTO>> {
    return this.http.post<DataResponseDTO<PagoResponseDTO>>(`${API_BASE}/pagos`, paymentData).pipe(
      tap(() => {
        console.log('Pago registrado');
        this.errorHandler.showSuccess('Pago registrado', 'El pago se registro correctamente');
      }),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Registrar pago');
        return throwError(() => error);
      })
    );
  }

  /**
   * Aprobar pago
   */
  approvePayment(pagoId: number | string): Observable<DataResponseDTO<PagoResponseDTO>> {
    return this.http.put<DataResponseDTO<PagoResponseDTO>>(`${API_BASE}/pagos/${pagoId}/aprobar`, null).pipe(
      tap(() => {
        console.log('Pago aprobado');
        this.errorHandler.showSuccess('Pago aprobado', 'El pago fue aprobado');
      }),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Aprobar pago');
        return throwError(() => error);
      })
    );
  }

  /**
   * Rechazar pago
   */
  rejectPayment(pagoId: number | string, motivo: string): Observable<DataResponseDTO<PagoResponseDTO>> {
    const params = new HttpParams().set('motivo', motivo);
    return this.http
      .put<DataResponseDTO<PagoResponseDTO>>(`${API_BASE}/pagos/${pagoId}/rechazar`, null, { params })
      .pipe(
        tap(() => {
          console.log('Pago rechazado');
          this.errorHandler.showWarning('Pago rechazado', 'El pago fue rechazado');
        }),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Rechazar pago');
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener pagos por ticket
   */
  getPaymentsByTicket(ticketId: number | string): Observable<DataResponseDTO<PagoResponseDTO[]>> {
    return this.http.get<DataResponseDTO<PagoResponseDTO[]>>(`${API_BASE}/pagos/ticket/${ticketId}`).pipe(
      tap(() => console.log('Pagos del ticket obtenidos')),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Obtener pagos del ticket');
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener pagos
   */
  getPayments(filters?: {
    estado?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    direction?: 'asc' | 'desc';
  }): Observable<DataResponseDTO<any>> {
    let params = new HttpParams();
    if (filters?.estado) params = params.set('estado', filters.estado);
    if (filters?.page !== undefined) params = params.set('page', String(filters.page));
    if (filters?.size !== undefined) params = params.set('size', String(filters.size));
    if (filters?.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters?.direction) params = params.set('direction', filters.direction);

    return this.http.get<DataResponseDTO<any>>(`${API_BASE}/pagos`, { params }).pipe(
      tap(() => console.log('Pagos obtenidos')),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Obtener pagos');
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener pago por ID
   */
  getPaymentById(pagoId: number | string): Observable<DataResponseDTO<PagoResponseDTO>> {
    return this.http.get<DataResponseDTO<PagoResponseDTO>>(`${API_BASE}/pagos/${pagoId}`).pipe(
      tap(() => console.log('Pago obtenido')),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Obtener pago');
        return throwError(() => error);
      })
    );
  }

  getBankAccounts(): Observable<DataResponseDTO<CuentaBancaria[]>> {
    return this.http
      .get<DataResponseDTO<CuentaBancaria[]>>(`${API_BASE}/cuentas-bancarias/activas`)
      .pipe(
        tap(() => console.log('Cuentas bancarias obtenidas')),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Obtener cuentas bancarias');
          return throwError(() => error);
        })
      );
  }
}
