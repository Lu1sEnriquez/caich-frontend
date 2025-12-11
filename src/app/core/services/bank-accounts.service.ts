import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './api.config';

export interface CuentaBancariaDTO {
  cuentaId?: number;
  banco: string;
  numeroCuenta: string;
  clabe?: string;
  titular: string;
  estaActiva: boolean;
}

export interface CrearCuentaBancariaDTO {
  banco: string;
  numeroCuenta: string;
  clabe?: string;
  titular: string;
  estaActiva?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BankAccountsService {
  private http = inject(HttpClient);
  private apiUrl = API_BASE;

  /**
   * Obtener todas las cuentas bancarias
   */
  getAll(): Observable<any> {
    return this.http.get(`${this.apiUrl}/cuentas-bancarias`);
  }

  /**
   * Obtener cuentas bancarias activas
   */
  getActive(): Observable<any> {
    return this.http.get(`${this.apiUrl}/cuentas-bancarias/activas`);
  }

  /**
   * Obtener cuentas por estado
   */
  getByStatus(activa: boolean): Observable<any> {
    return this.http.get(`${this.apiUrl}/cuentas-bancarias/estado/${activa}`);
  }

  /**
   * Obtener cuentas por banco
   */
  getByBank(banco: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/cuentas-bancarias/banco/${banco}`);
  }

  /**
   * Buscar cuentas
   */
  search(search: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/cuentas-bancarias/search`, {
      params: { search },
    });
  }

  /**
   * Obtener cuenta por ID
   */
  getById(cuentaId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/cuentas-bancarias/${cuentaId}`);
  }

  /**
   * Crear nueva cuenta
   */
  create(data: CrearCuentaBancariaDTO): Observable<any> {
    return this.http.post(`${this.apiUrl}/cuentas-bancarias`, data);
  }

  /**
   * Actualizar cuenta
   */
  update(cuentaId: number, data: Partial<CuentaBancariaDTO>): Observable<any> {
    return this.http.put(`${this.apiUrl}/cuentas-bancarias/${cuentaId}`, data);
  }

  /**
   * Cambiar estado de la cuenta
   */
  changeStatus(cuentaId: number, estaActiva: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/cuentas-bancarias/${cuentaId}/estado`, null, {
      params: { estaActiva },
    });
  }

  /**
   * Eliminar cuenta
   */
  delete(cuentaId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/cuentas-bancarias/${cuentaId}`);
  }

  /**
   * Contar cuentas activas
   */
  countActive(): Observable<any> {
    return this.http.get(`${this.apiUrl}/cuentas-bancarias/stats/activas`);
  }
}
