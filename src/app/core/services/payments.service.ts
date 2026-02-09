import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { API_BASE } from './api.config';

import {
  DataResponseDTO,
  BaseResponseDTO,
  TicketDTO,
} from '../models/api-models';
import { CuentaBancaria } from '../models/models';
import { ErrorHandlerService } from './errorHandler.service';

export interface RegistrarPagoDTO {
  ticketId: number;
  monto: number;
  metodoPago: string;
  fechaPago: string;
  notas?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PaymentsService {
  private http = inject(HttpClient);
  private errorHandler = inject(ErrorHandlerService);

  /**
   * Registrar pago propio (como paciente)
   */
  registerOwnPayment(paymentData: RegistrarPagoDTO): Observable<DataResponseDTO<TicketDTO>> {
    return this.http
      .post<DataResponseDTO<TicketDTO>>(`${API_BASE}/pagos/registrar-propio`, paymentData)
      .pipe(
        tap(() => {
          console.log('Pago registrado');
          this.errorHandler.showSuccess('Pago registrado', 'Tu pago se registro correctamente');
        }),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Registrar pago');
          return throwError(() => error);
        })
      );
  }

  /**
   * Actualizar estado de pago
   */
  updatePaymentStatus(
    ticketId: number | string,
    estadoPago: string,
    notas?: string,
    comprobante?: File,
    concepto?: string
  ): Observable<DataResponseDTO<TicketDTO>> {
    let params = new HttpParams().set('estadoPago', estadoPago);
    if (notas) params = params.set('notas', notas);
    if (concepto) params = params.set('concepto', concepto);

    // Si hay comprobante, usamos FormData para multipart
    if (comprobante) {
      const formData = new FormData();
      formData.append('comprobante', comprobante);
      if (notas) formData.append('notas', notas);
      if (concepto) formData.append('concepto', concepto);

      return this.http
        .put<DataResponseDTO<TicketDTO>>(
          `${API_BASE}/tickets/${ticketId}/estado`,
          formData,
          { params }
        )
        .pipe(
          tap(() => {
            console.log('Estado actualizado con comprobante:', ticketId);
            this.errorHandler.showSuccess('Estado actualizado', 'El cambio se guardo correctamente');
          }),
          catchError((error) => {
            this.errorHandler.handleHttpError(error, 'Actualizar estado');
            return throwError(() => error);
          })
        );
    }

    return this.http
      .put<DataResponseDTO<TicketDTO>>(`${API_BASE}/tickets/${ticketId}/estado`, null, { params })
      .pipe(
        tap(() => {
          console.log('Estado actualizado:', ticketId);
          this.errorHandler.showSuccess('Estado actualizado', 'El cambio se guardo correctamente');
        }),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Actualizar estado');
          return throwError(() => error);
        })
      );
  }

  /**
   * Subir comprobante de pago
   */
  uploadComprobante(ticketId: number | string, file: File): Observable<BaseResponseDTO> {
    const formData = new FormData();
    formData.append('comprobante', file);

    return this.http
      .post<BaseResponseDTO>(`${API_BASE}/tickets/${ticketId}/comprobante`, formData)
      .pipe(
        tap(() => {
          console.log('Comprobante subido');
          this.errorHandler.showSuccess(
            'Comprobante subido',
            'El comprobante se subio correctamente'
          );
        }),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Subir comprobante');
          return throwError(() => error);
        })
      );
  }

  viewComprobante(ticketId: number | string): Observable<Blob> {
    return this.http
      .get(`${API_BASE}/tickets/${ticketId}/comprobante`, {
        responseType: 'blob',
      })
      .pipe(
        tap(() => console.log('Comprobante obtenido')),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Obtener comprobante');
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
