import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { API_BASE } from './api.config';

import {
  DataResponseDTO,
  BaseResponseDTO,
  Pagination,
  TicketDTO,
  TicketFiltroDTO,
} from '../models/api-models';
import { TicketFilters } from '../models/models';
import { mapTicketStatusToApi, mapPaymentStatusToApi } from '../mappers/mappers';
import { TicketStatus, PaymentStatus } from '../models/enums';
import { ErrorHandlerService } from './errorHandler.service';

export interface CrearTicketRequest {
  pacienteId: number;
  terapeutaId: number;
  espacioId?: number;
  cuentaDestinoId: number;
  fecha: string; // ISO format
  duracion?: number;
  materia: string;
  conceptoIngreso?: string;
  conceptoTransferencia?: string;
  montoPagado: number;
  celular?: string;
  costoEspacio?: number;
  costoAdicional?: number;
  productos: ProductoTicketRequest[];
}

export interface ProductoTicketRequest {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  tipoUso: 'Venta' | 'Prestamo' | 'Uso';
}

@Injectable({
  providedIn: 'root',
})
export class TicketsService {
  private http = inject(HttpClient);
  private errorHandler = inject(ErrorHandlerService);

  /**
   * Obtener tickets con filtros avanzados
   */
  getTickets(filters?: TicketFilters): Observable<DataResponseDTO<Pagination<TicketFiltroDTO[]>>> {
    let params = new HttpParams();

    if (filters) {
      if (filters.pacienteId) params = params.set('pacienteId', String(filters.pacienteId));
      if (filters.terapeutaId) params = params.set('terapeutaId', String(filters.terapeutaId));
      if (filters.estadoTicket)
        params = params.set('estadoTicket', mapTicketStatusToApi(filters.estadoTicket));
      if (filters.estadoPago)
        params = params.set('estadoPago', mapPaymentStatusToApi(filters.estadoPago));
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
        tap((response) =>
          console.log('Tickets obtenidos:', response.data.content.length, 'registros')
        ),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Obtener tickets');
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener ticket por ID
   */
  getTicketById(ticketId: number | string): Observable<DataResponseDTO<TicketDTO>> {
    return this.http.get<DataResponseDTO<TicketDTO>>(`${API_BASE}/tickets/${ticketId}`).pipe(
      tap((response) => console.log('Ticket obtenido:', response.data.folio)),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Obtener ticket');
        return throwError(() => error);
      })
    );
  }

  /**
   * Crear nuevo ticket/cita
   */
  createTicket(ticketData: CrearTicketRequest): Observable<DataResponseDTO<TicketDTO>> {
    return this.http.post<DataResponseDTO<TicketDTO>>(`${API_BASE}/tickets`, ticketData).pipe(
      tap((response) => {
        console.log('Ticket creado:', response.data.folio);
        this.errorHandler.showSuccess('Cita creada', 'La cita se registro exitosamente');
      }),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Crear cita');
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualizar estado de ticket
   */
  updateTicketStatus(
    ticketId: number | string,
    estadoTicket?: TicketStatus,
    estadoPago?: PaymentStatus,
    notas?: string
  ): Observable<DataResponseDTO<TicketDTO>> {
    let params = new HttpParams();

    if (estadoTicket) params = params.set('estadoTicket', mapTicketStatusToApi(estadoTicket));
    if (estadoPago) params = params.set('estadoPago', mapPaymentStatusToApi(estadoPago));
    if (notas) params = params.set('notas', notas);

    return this.http
      .put<DataResponseDTO<TicketDTO>>(`${API_BASE}/tickets/${ticketId}/estado`, null, { params })
      .pipe(
        tap(() => {
          console.log('Estado de ticket actualizado');
          this.errorHandler.showSuccess(
            'Estado actualizado',
            'Los cambios se guardaron correctamente'
          );
        }),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Actualizar estado');
          return throwError(() => error);
        })
      );
  }

  /**
   * Cancelar ticket
   */
  cancelTicket(ticketId: number | string, motivo: string): Observable<BaseResponseDTO> {
    const params = new HttpParams().set('motivo', motivo);

    return this.http
      .post<BaseResponseDTO>(`${API_BASE}/tickets/${ticketId}/cancelar`, null, { params })
      .pipe(
        tap(() => {
          console.log('Ticket cancelado');
          this.errorHandler.showSuccess('Cita cancelada', 'La cita se canceló correctamente');
        }),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Cancelar cita');
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener estadísticas de tickets
   */
  getTicketStats(
    fechaInicio?: string,
    fechaFin?: string
  ): Observable<{
    total: number;
    agendados: number;
    completados: number;
    cancelados: number;
    ingresoTotal: number;
  }> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
    if (fechaFin) params = params.set('fechaFin', fechaFin);

    //TODO: Implementar endpoint GET /tickets/stats en la API
    // Response esperado: { total, agendados, completados, cancelados, ingresoTotal }
    console.warn('getTicketStats: Endpoint pendiente en la API');

    return this.http.get<any>(`${API_BASE}/tickets/stats`, { params }).pipe(
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Obtener estadísticas');
        return throwError(() => error);
      })
    );
  }
}
