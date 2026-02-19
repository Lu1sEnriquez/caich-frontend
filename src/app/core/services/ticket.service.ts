import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE}/tickets`;

  /**
   * Crear un nuevo ticket
   */
  createTicket(ticket: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, ticket);
  }

  /**
   * Actualizar un ticket existente
   */
  updateTicket(id: string, ticket: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, ticket);
  }

  /**
   * Obtener un ticket por ID
   */
  getTicket(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtener todos los tickets de una cita
   */
  getTicketsByCita(citaId: string): Observable<any> {
    let params = new HttpParams().set('citaId', citaId);
    return this.http.get(`${this.apiUrl}/cita/${citaId}`, { params });
  }

  /**
   * Eliminar un ticket
   */
  deleteTicket(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtener tickets paginados con filtros
   */
  getTickets(page: number = 0, size: number = 10, filters: any = {}): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filters.tipoTicket) {
      params = params.set('tipoTicket', filters.tipoTicket);
    }

    if (filters.estado) {
      params = params.set('estado', filters.estado);
    }

    if (filters.fechaInicio) {
      params = params.set('fechaInicio', filters.fechaInicio);
    }

    if (filters.fechaFin) {
      params = params.set('fechaFin', filters.fechaFin);
    }

    return this.http.get(`${this.apiUrl}`, { params });
  }

  /**
   * Generar reporte de ticket
   */
  generateTicketReport(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/report`, {
      responseType: 'blob'
    });
  }
}
