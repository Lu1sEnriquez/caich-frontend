import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './api.config';
import { DataResponseDTO, DashboardAdminDTO } from '../models/api-models';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  constructor(private http: HttpClient) {}

  obtenerDashboardAdmin(): Observable<DataResponseDTO<DashboardAdminDTO>> {
    return this.http.get<DataResponseDTO<DashboardAdminDTO>>(`${API_BASE}/reportes/dashboard`);
  }
}
