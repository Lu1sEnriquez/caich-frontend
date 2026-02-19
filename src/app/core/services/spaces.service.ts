import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './api.config';
import { DataResponseDTO } from '../models/api-models';

export interface EspacioDTO {
  espacioId?: number;
  nombre: string;
  descripcion?: string;
  capacidad: number;
  costoPorHora: number;
  estaActivo: boolean;
}

export interface CrearEspacioDTO {
  nombre: string;
  descripcion?: string;
  capacidad: number;
  costoPorHora: number;
  estaActivo?: boolean;
}

export interface ActualizarEspacioDTO extends Partial<CrearEspacioDTO> {}

// Respuestas tipadas del API
export interface EspacioResponse extends DataResponseDTO<EspacioDTO> {}
export interface EspaciosListResponse extends DataResponseDTO<EspacioDTO[]> {}

@Injectable({
  providedIn: 'root',
})
export class SpacesService {
  private http = inject(HttpClient);
  private apiUrl = API_BASE;

  /**
   * Obtener todos los espacios
   */
  getAll(): Observable<EspaciosListResponse> {
    return this.http.get<EspaciosListResponse>(`${this.apiUrl}/espacios`);
  }

  /**
   * Obtener espacios activos
   */
  getActive(): Observable<EspaciosListResponse> {
    return this.http.get<EspaciosListResponse>(`${this.apiUrl}/espacios/activos`);
  }

  /**
   * Obtener espacio por ID
   */
  getById(espacioId: number): Observable<EspacioResponse> {
    return this.http.get<EspacioResponse>(`${this.apiUrl}/espacios/${espacioId}`);
  }

  /**
   * Crear nuevo espacio
   */
  create(data: CrearEspacioDTO): Observable<EspacioResponse> {
    return this.http.post<EspacioResponse>(`${this.apiUrl}/espacios`, data);
  }

  /**
   * Actualizar espacio
   */
  update(espacioId: number, data: ActualizarEspacioDTO): Observable<EspacioResponse> {
    return this.http.put<EspacioResponse>(`${this.apiUrl}/espacios/${espacioId}`, data);
  }

  /**
   * Cambiar estado del espacio
   */
  changeStatus(espacioId: number, estaActivo: boolean): Observable<EspacioResponse> {
    return this.http.put<EspacioResponse>(`${this.apiUrl}/espacios/${espacioId}/estado`, null, {
      params: { estaActivo },
    });
  }

  /**
   * Eliminar espacio
   */
  delete(espacioId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/espacios/${espacioId}`);
  }

  /**
   * Obtener espacios disponibles por capacidad mínima
   */
  getAvailableByCapacity(capacidadMinima: number): Observable<EspaciosListResponse> {
    return this.http.get<EspaciosListResponse>(`${this.apiUrl}/espacios/disponibles`, {
      params: { capacidadMinima },
    });
  }
}
