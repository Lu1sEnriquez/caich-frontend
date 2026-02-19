import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

import { API_BASE } from './api.config';

import {
  DataResponseDTO,
  BaseResponseDTO,
  Pagination,
  TicketResponseDTO,
  TicketFiltroResponseDTO,
  TicketRequestDTO,
} from '../models/api-models';
import { TicketFilters } from '../models/models';
import { mapTicketStatusToApi, mapFinancialStatusToApi } from '../mappers/mappers';
import { TicketStatus } from '../models/enums';
import { ErrorHandlerService } from './errorHandler.service';

@Injectable({
  providedIn: 'root',
})
export class TicketsService {
  private http = inject(HttpClient);
  private errorHandler = inject(ErrorHandlerService);

  /**
   * Obtener tickets con filtros simples (para tabla)
   */
  obtenerTickets(filtro?: TicketFiltroResponseDTO): Observable<TicketFiltroResponseDTO[]> {
    let params = new HttpParams();

    if (filtro?.estadoTicket) params = params.set('estadoTicket', filtro.estadoTicket);
    if (filtro?.estadoFinanciero) params = params.set('estadoFinanciero', filtro.estadoFinanciero);

    return this.http
      .get<DataResponseDTO<TicketFiltroResponseDTO[]>>(`${API_BASE}/tickets`, { params })
      .pipe(
        map((response) => response.data || []),
        tap((data) => {
          console.log('Tickets obtenidos:', data?.length || 0, 'registros');
        }),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Obtener tickets');
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener tickets con filtros avanzados
   */
  getTickets(
    filters?: TicketFilters
  ): Observable<DataResponseDTO<Pagination<TicketFiltroResponseDTO[]>>> {
    let params = new HttpParams();

    if (filters) {
      if (filters.pacienteId) params = params.set('pacienteId', String(filters.pacienteId));
      if (filters.terapeutaId) params = params.set('terapeutaId', String(filters.terapeutaId));
      if (filters.estadoTicket)
        params = params.set('estadoTicket', mapTicketStatusToApi(filters.estadoTicket));
      if (filters.estadoFinanciero)
        params = params.set('estadoFinanciero', mapFinancialStatusToApi(filters.estadoFinanciero));
      if (filters.fechaInicio) params = params.set('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) params = params.set('fechaFin', filters.fechaFin);
      if (filters.page !== undefined) params = params.set('page', String(filters.page));
      if (filters.size !== undefined) params = params.set('size', String(filters.size));
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.direction) params = params.set('direction', filters.direction);
    }

    return this.http
      .get<DataResponseDTO<Pagination<TicketFiltroResponseDTO[]>>>(`${API_BASE}/tickets`, {
        params,
      })
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
  getTicketById(ticketId: number | string): Observable<DataResponseDTO<TicketResponseDTO>> {
    return this.http
      .get<DataResponseDTO<TicketResponseDTO>>(`${API_BASE}/tickets/${ticketId}`)
      .pipe(
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
  crearTicket(ticketData: TicketRequestDTO): Observable<TicketResponseDTO> {
    return this.http
      .post<DataResponseDTO<TicketResponseDTO>>(`${API_BASE}/tickets`, ticketData)
      .pipe(
      map((response) => response.data),
      tap((ticket) => {
        console.log('Ticket creado:', ticket.folio);
        this.errorHandler.showSuccess('Cita creada', 'La cita se registro exitosamente');
      }),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Crear cita');
        return throwError(() => error);
      })
    );
  }

  /**
   * Crear nuevo ticket (alias)
   */
  createTicket(ticketData: TicketRequestDTO): Observable<DataResponseDTO<TicketResponseDTO>> {
    return this.http
      .post<DataResponseDTO<TicketResponseDTO>>(`${API_BASE}/tickets`, ticketData)
      .pipe(
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
   * Actualizar ticket
   */
  actualizarTicket(ticketData: any): Observable<TicketResponseDTO> {
    return this.http
      .put<DataResponseDTO<TicketResponseDTO>>(
        `${API_BASE}/tickets/${ticketData.ticketId}`,
        ticketData
      )
      .pipe(
      map((response) => response.data),
      tap((ticket) => {
        console.log('Ticket actualizado:', ticket.folio);
        this.errorHandler.showSuccess('Cita actualizada', 'Los cambios se guardaron correctamente');
      }),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Actualizar cita');
        return throwError(() => error);
      })
    );
  }

  /**
   * Eliminar ticket
   */
  eliminarTicket(ticketId: number): Observable<BaseResponseDTO> {
    return this.http.delete<BaseResponseDTO>(`${API_BASE}/tickets/${ticketId}`).pipe(
      tap(() => {
        console.log('Ticket eliminado');
        this.errorHandler.showSuccess('Ticket eliminado', 'El ticket se eliminó correctamente');
      }),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Eliminar ticket');
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
    notas?: string
  ): Observable<DataResponseDTO<TicketResponseDTO>> {
    let params = new HttpParams();

    if (estadoTicket) params = params.set('estadoTicket', mapTicketStatusToApi(estadoTicket));
    if (notas) params = params.set('notas', notas);

    return this.http
      .put<DataResponseDTO<TicketResponseDTO>>(`${API_BASE}/tickets/${ticketId}/estado`, null, {
        params,
      })
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
