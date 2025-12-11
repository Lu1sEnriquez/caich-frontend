import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { API_BASE } from './api.config';

import {
  DataResponseDTO,
  BaseResponseDTO,
  Pagination,
  UsuarioDTO,
  CrearUsuarioDTO,
  ActualizarUsuarioDTO,
  CambiarPasswordDTO,
} from '../models/api-models';
import { User, UserFilters, PaginatedResponse } from '../models/models';
import { mapUserFromApi, mapRoleToApi, mapStatusToApi } from '../mappers/mappers';
import { UserRole, UserStatus } from '../models/enums';
import { ErrorHandlerService } from './errorHandler.service';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private http = inject(HttpClient);
  private errorHandler = inject(ErrorHandlerService);

  /**
   * Obtener todos los usuarios con filtros
   */
  getAllUsers(filters?: UserFilters): Observable<DataResponseDTO<Pagination<UsuarioDTO[]>>> {
    let params = new HttpParams();

    if (filters) {
      if (filters.rol) params = params.set('rol', mapRoleToApi(filters.rol));
      if (filters.estado) params = params.set('estado', mapStatusToApi(filters.estado));
      if (filters.page !== undefined) params = params.set('page', String(filters.page));
      if (filters.size !== undefined) params = params.set('size', String(filters.size));
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.direction) params = params.set('direction', filters.direction);
    }

    return this.http
      .get<DataResponseDTO<Pagination<UsuarioDTO[]>>>(`${API_BASE}/usuarios`, { params })
      .pipe(
        tap(() => console.log('✅ Usuarios obtenidos')),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Obtener usuarios');
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener usuario por ID
   */
  getUserById(usuarioId: number | string): Observable<DataResponseDTO<UsuarioDTO>> {
    return this.http.get<DataResponseDTO<UsuarioDTO>>(`${API_BASE}/usuarios/${usuarioId}`).pipe(
      tap(() => console.log('✅ Usuario obtenido:', usuarioId)),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Obtener usuario');
        return throwError(() => error);
      })
    );
  }

  /**
   * Buscar usuarios por término
   */
  searchUsers(
    searchTerm: string,
    page = 0,
    size = 20
  ): Observable<DataResponseDTO<Pagination<UsuarioDTO[]>>> {
    const params = new HttpParams()
      .set('search', searchTerm)
      .set('page', String(page))
      .set('size', String(size));

    return this.http
      .get<DataResponseDTO<Pagination<UsuarioDTO[]>>>(`${API_BASE}/usuarios/search`, { params })
      .pipe(
        tap(() => console.log('✅ Búsqueda completada:', searchTerm)),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Buscar usuarios');
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener usuarios por rol
   */
  getUsersByRole(
    rol: UserRole,
    page = 0,
    size = 20
  ): Observable<DataResponseDTO<Pagination<UsuarioDTO[]>>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));

    return this.http
      .get<DataResponseDTO<Pagination<UsuarioDTO[]>>>(`${API_BASE}/usuarios/rol/${rol}`, {
        params,
      })
      .pipe(
        tap(() => console.log('✅ Usuarios por rol obtenidos:', rol)),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Obtener usuarios por rol');
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener usuarios activos por rol
   */
  getActiveUsersByRole(rol: UserRole): Observable<DataResponseDTO<UsuarioDTO[]>> {
    return this.http
      .get<DataResponseDTO<UsuarioDTO[]>>(`${API_BASE}/usuarios/rol/${rol}/activos`)
      .pipe(
        tap(() => console.log('✅ Usuarios activos obtenidos:', rol)),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Obtener usuarios activos');
          return throwError(() => error);
        })
      );
  }

  /**
   * Crear nuevo usuario
   */
  createUser(userData: CrearUsuarioDTO): Observable<DataResponseDTO<UsuarioDTO>> {
    return this.http.post<DataResponseDTO<UsuarioDTO>>(`${API_BASE}/usuarios`, userData).pipe(
      tap((response) => {
        console.log('✅ Usuario creado:', response.data.email);
        this.errorHandler.showSuccess('Usuario creado', 'El usuario se creó exitosamente');
      }),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Crear usuario');
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualizar usuario
   */
  updateUser(
    usuarioId: number | string,
    userData: ActualizarUsuarioDTO
  ): Observable<DataResponseDTO<UsuarioDTO>> {
    return this.http
      .put<DataResponseDTO<UsuarioDTO>>(`${API_BASE}/usuarios/${usuarioId}`, userData)
      .pipe(
        tap((response) => {
          console.log('✅ Usuario actualizado:', usuarioId);
          this.errorHandler.showSuccess(
            'Usuario actualizado',
            'Los cambios se guardaron correctamente'
          );
        }),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Actualizar usuario');
          return throwError(() => error);
        })
      );
  }

  /**
   * Eliminar usuario
   */
  deleteUser(usuarioId: number | string): Observable<BaseResponseDTO> {
    return this.http.delete<BaseResponseDTO>(`${API_BASE}/usuarios/${usuarioId}`).pipe(
      tap(() => {
        console.log('✅ Usuario eliminado:', usuarioId);
        this.errorHandler.showSuccess('Usuario eliminado', 'El usuario se eliminó correctamente');
      }),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Eliminar usuario');
        return throwError(() => error);
      })
    );
  }

  /**
   * Cambiar contraseña
   */
  changePassword(
    usuarioId: number | string,
    passwordData: CambiarPasswordDTO
  ): Observable<BaseResponseDTO> {
    return this.http
      .put<BaseResponseDTO>(`${API_BASE}/usuarios/${usuarioId}/password`, passwordData)
      .pipe(
        tap(() => {
          console.log('✅ Contraseña cambiada');
          this.errorHandler.showSuccess(
            'Contraseña actualizada',
            'Tu contraseña se cambió correctamente'
          );
        }),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Cambiar contraseña');
          return throwError(() => error);
        })
      );
  }

  /**
   * Cambiar estado de usuario
   */
  changeUserStatus(
    usuarioId: number | string,
    estado: UserStatus
  ): Observable<DataResponseDTO<UsuarioDTO>> {
    const body = { estado: mapStatusToApi(estado) };

    return this.http
      .put<DataResponseDTO<UsuarioDTO>>(`${API_BASE}/usuarios/${usuarioId}/estado`, body)
      .pipe(
        tap(() => {
          console.log('✅ Estado de usuario actualizado:', estado);
          this.errorHandler.showSuccess('Estado actualizado', `El usuario ahora está: ${estado}`);
        }),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Cambiar estado de usuario');
          return throwError(() => error);
        })
      );
  }

  /**
   * Subir foto de perfil
   */
  uploadProfilePhoto(
    usuarioId: number | string,
    file: File
  ): Observable<DataResponseDTO<{ fotoUrl: string; mensaje: string }>> {
    const formData = new FormData();
    formData.append('foto', file);

    return this.http
      .post<DataResponseDTO<{ fotoUrl: string; mensaje: string }>>(
        `${API_BASE}/usuarios/${usuarioId}/foto`,
        formData
      )
      .pipe(
        tap(() => {
          console.log('✅ Foto de perfil subida');
          this.errorHandler.showSuccess(
            'Foto actualizada',
            'Tu foto de perfil se actualizó correctamente'
          );
        }),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Subir foto de perfil');
          return throwError(() => error);
        })
      );
  }

  /**
   * Eliminar foto de perfil
   */
  deleteProfilePhoto(usuarioId: number | string): Observable<BaseResponseDTO> {
    return this.http.delete<BaseResponseDTO>(`${API_BASE}/usuarios/${usuarioId}/foto`).pipe(
      tap(() => {
        console.log('✅ Foto de perfil eliminada');
        this.errorHandler.showSuccess(
          'Foto eliminada',
          'Tu foto de perfil se eliminó correctamente'
        );
      }),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Eliminar foto de perfil');
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener usuario por ID
   */
  obtenerUsuarioPorId(usuarioId: number): Observable<DataResponseDTO<UsuarioDTO>> {
    return this.http.get<DataResponseDTO<UsuarioDTO>>(`${API_BASE}/usuarios/${usuarioId}`).pipe(
      tap(() => console.log('✅ Usuario obtenido')),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Obtener usuario');
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener estadísticas de usuarios
   */
  getUserStats(): Observable<{ total: number; activos: number; nuevos: number }> {
    //TODO: Implementar endpoint GET /usuarios/stats en la API
    // Endpoint sugerido: GET /api/usuarios/stats
    // Response: { total: number, activos: number, nuevosMes: number }

    console.warn('⚠️ getUserStats: Endpoint no implementado en la API');
    return throwError(() => new Error('Endpoint no implementado'));
  }
}
