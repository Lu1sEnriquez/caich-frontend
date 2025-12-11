import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { API_BASE } from './api.config';

import {
  DataResponseDTO,
  BaseResponseDTO,
  Pagination,
  TicketDTO,
  TicketFiltroDTO,
} from '../models/api-models';
import { CuentaBancaria, Payment, TicketFilters } from '../models/models';
import {
  mapTicketFromApi,
  mapTicketFiltroFromApi,
  mapTicketStatusToApi,
  mapPaymentStatusToApi,
} from '../mappers/mappers';
import { TicketStatus, PaymentStatus } from '../models/enums';
import { ErrorHandlerService } from './errorHandler.service';

export interface RegistrarPagoDTO {
  ticketId: number;
  monto: number;
  metodoPago: string;
  fechaPago: string;
  notas?: string;
}

export interface CreatePendingPaymentDTO {
  ticketId: number;
  monto: number;
  cuentaDestinoId: number;
  pacienteId?: number;
  terapeutaId?: number;
  notas?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PaymentsService {
  private http = inject(HttpClient);
  private errorHandler = inject(ErrorHandlerService);

  /**
   * Obtener tickets/pagos con filtros
   */
  getTickets(filters?: TicketFilters): Observable<DataResponseDTO<Pagination<TicketFiltroDTO[]>>> {
    let params = new HttpParams();

    if (filters) {
      if (filters.pacienteId) params = params.set('pacienteId', String(filters.pacienteId));
      if (filters.terapeutaId) params = params.set('terapeutaId', String(filters.terapeutaId));
      if (filters.estadoTicket)
        params = params.set('estadoTicket', mapTicketStatusToApi(filters.estadoTicket));
      if (filters.estadoPago)
        params = params.set('estadoPago', this.mapStatusToAPI(filters.estadoPago));
      if (filters.fechaInicio) params = params.set('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) params = params.set('fechaFin', filters.fechaFin);
      if (filters.page !== undefined) params = params.set('page', String(filters.page));
      if (filters.size !== undefined) params = params.set('size', String(filters.size));
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.direction) params = params.set('direction', filters.direction);
    }

    return this.http
      .get<DataResponseDTO<Pagination<TicketFiltroDTO[]>>>(`${API_BASE}/tickets`, { params })
      .pipe(
        tap(() => console.log('✅ Tickets obtenidos')),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Obtener tickets');
          return throwError(() => error);
        })
      );
  }

  /**
   * Registrar pago propio (como paciente)
   */
  registerOwnPayment(paymentData: RegistrarPagoDTO): Observable<DataResponseDTO<TicketDTO>> {
    return this.http
      .post<DataResponseDTO<TicketDTO>>(`${API_BASE}/pagos/registrar-propio`, paymentData)
      .pipe(
        tap(() => {
          console.log('✅ Pago registrado');
          this.errorHandler.showSuccess('Pago registrado', 'Tu pago se registró correctamente');
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
            console.log('✅ Estado actualizado con comprobante:', ticketId);
            this.errorHandler.showSuccess('Estado actualizado', 'El cambio se guardó correctamente');
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
          console.log('✅ Estado actualizado:', ticketId);
          this.errorHandler.showSuccess('Estado actualizado', 'El cambio se guardó correctamente');
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
          console.log('✅ Comprobante subido');
          this.errorHandler.showSuccess(
            'Comprobante subido',
            'El comprobante se subió correctamente'
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
        tap(() => console.log('✅ Comprobante obtenido')),
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
        tap(() => console.log('✅ Cuentas bancarias obtenidas')),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Obtener cuentas bancarias');
          return throwError(() => error);
        })
      );
  }

  /**
   * Crear un pago pendiente ligado a un ticket (cliente/administración)
   * NOTE: Endpoint en la API puede no existir aún; agregar //TODO para backend.
   */
  createPendingPayment(data: CreatePendingPaymentDTO): Observable<DataResponseDTO<any>> {
    // TODO: implementar en la API: POST /pagos (o /pagos/pendiente) para crear pagos pendientes
    return this.http.post<DataResponseDTO<any>>(`${API_BASE}/pagos`, data).pipe(
      tap(() => {
        console.log('✅ Pago pendiente creado');
        this.errorHandler.showSuccess('Pago pendiente', 'Se creó el pago pendiente ligado a la cita');
      }),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Crear pago pendiente');
        return throwError(() => error);
      })
    );
  }

  //TODO: mover estos mappers
  /**
   * Mapear TicketFiltroDTO a Payment
   */
  mapToPayment(dto: TicketFiltroDTO): Payment {
    return {
      id: String(dto.ticketId ?? 0),
      nombre: dto.pacienteNombre ?? '',
      email: dto.pacienteEmail,
      folio: dto.folio ?? '',
      banco: undefined, // No viene en TicketFiltroDTO
      concepto: dto.materia,
      monto: dto.costoTotal ?? 0,
      status: this.mapStatusFromAPI(dto.estadoPago ?? 'Pendiente'),
      fechaPago: dto.fecha ? new Date(dto.fecha) : new Date(),
      fechaRegistro: dto.fechaCreacion ? new Date(dto.fechaCreacion) : new Date(),
      comprobante: undefined,
    };
  }

  /**
   * Obtener pagos por paciente
   */
  obtenerPagosPorPaciente(pacienteId: number): Observable<DataResponseDTO<TicketDTO[]>> {
    return this.http.get<DataResponseDTO<TicketDTO[]>>(`${API_BASE}/pagos/paciente/${pacienteId}`).pipe(
      tap(() => console.log('✅ Pagos del paciente obtenidos')),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Obtener pagos del paciente');
        return throwError(() => error);
      })
    );
  }

  /**
   * Helper: Mapear estado de pago de la API al enum
   */
  mapStatusFromAPI(apiStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      Pendiente: PaymentStatus.PENDIENTE,
      Pagado: PaymentStatus.PAGADO,
      Verificado: PaymentStatus.VERIFICADO,
      Rechazado: PaymentStatus.RECHAZADO,
    };
    return statusMap[apiStatus] || PaymentStatus.PENDIENTE;
  }

  /**
   * Helper: Mapear estado de pago del enum a la API
   */
  mapStatusToAPI(status: PaymentStatus): string {
    return mapPaymentStatusToApi(status);
  }
}
