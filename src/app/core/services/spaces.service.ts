import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './api.config';

export interface EspacioDTO {
  espacioId?: number;
  nombre: string;
  tipo: string;
  descripcion?: string;
  capacidad: number;
  costoPorHora: number;
  estaActivo: boolean;
}

export interface CrearEspacioDTO {
  nombre: string;
  tipo: string;
  descripcion?: string;
  capacidad: number;
  costoPorHora: number;
  estaActivo?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SpacesService {
  private http = inject(HttpClient);
  private apiUrl = API_BASE;

  /**
   * Obtener todos los espacios
   */
  getAll(): Observable<any> {
    return this.http.get(`${this.apiUrl}/espacios`);
  }

  /**
   * Obtener espacios activos
   */
  getActive(): Observable<any> {
    return this.http.get(`${this.apiUrl}/espacios/activos`);
  }

  /**
   * Obtener espacios por tipo
   */
  getByType(tipo: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/espacios/tipo/${tipo}`);
  }

  /**
   * Obtener tipos de espacios disponibles
   */
  getTypes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/espacios/tipos`);
  }

  /**
   * Obtener espacio por ID
   */
  getById(espacioId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/espacios/${espacioId}`);
  }

  /**
   * Crear nuevo espacio
   */
  create(data: CrearEspacioDTO): Observable<any> {
    return this.http.post(`${this.apiUrl}/espacios`, data);
  }

  /**
   * Actualizar espacio
   */
  update(espacioId: number, data: Partial<EspacioDTO>): Observable<any> {
    return this.http.put(`${this.apiUrl}/espacios/${espacioId}`, data);
  }

  /**
   * Cambiar estado del espacio
   */
  changeStatus(espacioId: number, estaActivo: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/espacios/${espacioId}/estado`, null, {
      params: { estaActivo },
    });
  }

  /**
   * Eliminar espacio
   */
  delete(espacioId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/espacios/${espacioId}`);
  }

  /**
   * Obtener espacios disponibles por capacidad mínima
   */
  getAvailableByCapacity(capacidadMinima: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/espacios/disponibles`, {
      params: { capacidadMinima },
    });
  }

  /**
   * Contar espacios activos
   */
  countActive(): Observable<any> {
    return this.http.get(`${this.apiUrl}/espacios/stats/activos`);
  }
}
