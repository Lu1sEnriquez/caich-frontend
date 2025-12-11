import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';
import { API_BASE } from './api.config';
import { AuthUser, LoginRequest, RegisterRequest, AuthResponse } from '../models/models';
import { ErrorHandlerService } from './errorHandler.service';
import { parseUserRole, UserRole } from '../models/enums';

interface LoginResponseDTO {
  accessToken: string;
  refreshToken: string;
  type: string;
  usuarioId: number;
  nombreCompleto: string;
  email: string;
  rol: string;
  expiresIn: number;
}

interface DataResponseDTO<T> {
  status: string;
  message?: string;
  timestamp?: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private errorHandler = inject(ErrorHandlerService);

  // Signal para el usuario actual
  private currentUserSignal = signal<AuthUser | null>(this.getUserFromStorage());

  // BehaviorSubject para saber cuándo termina de cargar
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  // Exposición readonly del usuario
  currentUser = this.currentUserSignal.asReadonly();

  // Computed para autenticación
  isAuthenticated = computed(() => this.currentUser() !== null);

  // Computed para el rol
  currentRole = computed(() => this.currentUser()?.rol ?? null);

  constructor() {
    console.log('🔐 AuthService inicializado');
    const user = this.currentUser();
    if (user) {
      console.log('✅ Usuario en sesión:', user.email, '- Rol:', user.rol);
    } else {
      console.log('ℹ️ No hay usuario en sesión');
    }
  }

  /**
   * Login - Autenticación de usuario
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    console.log('🔐 Iniciando login:', credentials.email);
    this.loadingSubject.next(true);

    const loginDTO = {
      email: credentials.email,
      password: credentials.password,
    };

    return this.http
      .post<DataResponseDTO<LoginResponseDTO>>(`${API_BASE}/auth/login`, loginDTO)
      .pipe(
        map((response) => {
          const data = response.data;

          const authResp: AuthResponse = {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            type: data.type,
            usuarioId: data.usuarioId,
            nombreCompleto: data.nombreCompleto,
            email: data.email,
            rol: parseUserRole(data.rol),
            expiresIn: data.expiresIn,
          };

          return authResp;
        }),
        tap((response) => {
          console.log('✅ Login exitoso:', response.email);
          this.saveAuthData(response);

          // Navegar según el rol
          this.navigateByRole(response.rol);
        }),
        catchError((error) => {
          console.error('❌ Error en login:', error);
          this.errorHandler.handleHttpError(error, 'Inicio de sesión');
          return throwError(() => error);
        }),
        finalize(() => {
          this.loadingSubject.next(false);
        })
      );
  }

  /**
   * Register - Registro de nuevo usuario
   */
  register(userData: RegisterRequest): Observable<AuthResponse> {
    console.log('📝 Iniciando registro:', userData.email);
    this.loadingSubject.next(true);

    const registerDTO = {
      nombreCompleto: userData.nombreCompleto,
      email: userData.email,
      folio: userData.folio || '',
      idAlumno: userData.idAlumno || '',
      password: userData.password,
      telefono: userData.telefono || '',
      rol: userData.rol,
    };

    return this.http
      .post<DataResponseDTO<LoginResponseDTO>>(`${API_BASE}/auth/register`, registerDTO)
      .pipe(
        map((response) => {
          const data = response.data;

          const authResp: AuthResponse = {
            accessToken: data.accessToken || '',
            refreshToken: data.refreshToken || '',
            type: data.type || 'Bearer',
            usuarioId: data.usuarioId || 0,
            nombreCompleto: userData.nombreCompleto,
            email: userData.email,
            rol: userData.rol,
            expiresIn: data.expiresIn || 0,
          };

          return authResp;
        }),
        tap((response) => {
          console.log('✅ Registro exitoso:', response.email);

          // Si la API devuelve token, guardar y navegar
          if (response.accessToken) {
            this.saveAuthData(response);
            this.navigateByRole(response.rol);
          } else {
            // Si no devuelve token, mostrar mensaje de éxito
            this.errorHandler.showSuccess(
              'Registro exitoso',
              'Tu cuenta ha sido creada. Por favor inicia sesión.'
            );
          }
        }),
        catchError((error) => {
          console.error('❌ Error en registro:', error);
          this.errorHandler.handleHttpError(error, 'Registro');
          return throwError(() => error);
        }),
        finalize(() => {
          this.loadingSubject.next(false);
        })
      );
  }

  /**
   * Logout - Cerrar sesión
   */
  logout(): void {
    console.log('👋 Cerrando sesión');

    //TODO: Implementar endpoint POST /auth/logout en la API
    // Este endpoint debe invalidar el refresh token en el servidor

    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_expires_at'); // Limpiar expiración
    this.currentUserSignal.set(null);

    this.errorHandler.showInfo('Sesión cerrada', 'Has cerrado sesión correctamente');
    this.router.navigate(['/login']);
  }

  /**
   * Refresh Token
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<DataResponseDTO<LoginResponseDTO>>(`${API_BASE}/auth/refresh`, { refreshToken })
      .pipe(
        map((response) => {
          const data = response.data;

          const authResp: AuthResponse = {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            type: data.type,
            usuarioId: data.usuarioId,
            nombreCompleto: data.nombreCompleto,
            email: data.email,
            rol: parseUserRole(data.rol),
            expiresIn: data.expiresIn,
          };

          return authResp;
        }),
        tap((response) => {
          console.log('🔄 Token refrescado');
          this.saveAuthData(response);
        }),
        catchError((error) => {
          console.error('❌ Error al refrescar token:', error);
          this.logout();
          return throwError(() => error);
        })
      );
  }

  /**
   * Verificación síncrona de autenticación
   */
  isAuthenticatedSync(): boolean {
    return this.isAuthenticated();
  }

  /**
   * Verificación de rol
   */
  hasRole(role: UserRole): boolean {
    return this.currentRole() === role;
  }

  /**
   * Obtener token actual
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Guardar datos de autenticación
   */
  private saveAuthData(response: AuthResponse): void {
    const user: AuthUser = {
      id: String(response.usuarioId),
      nombreCompleto: response.nombreCompleto,
      email: response.email,
      rol: response.rol,
      foto: '',
    };

    // Calcular fecha de expiración (Date.now() + segundos * 1000)
    const expiresAt = Date.now() + (response.expiresIn * 1000);
    localStorage.setItem('auth_expires_at', expiresAt.toString());

    localStorage.setItem('auth_token', response.accessToken);
    localStorage.setItem('refresh_token', response.refreshToken);
    localStorage.setItem('auth_user', JSON.stringify(user));

    this.currentUserSignal.set(user);

    console.log('💾 Datos guardados en localStorage');
  }

  /**
   * Obtener usuario de localStorage
   */
  private getUserFromStorage(): AuthUser | null {
    try {
      const userStr = localStorage.getItem('auth_user');
      const expiresAtStr = localStorage.getItem('auth_expires_at');
      if (!userStr) return null;

      const user = JSON.parse(userStr);

      // VERIFICACIÓN DE EXPIRACIÓN
      if (expiresAtStr) {
        const expiresAt = parseInt(expiresAtStr, 10);
        if (Date.now() > expiresAt) {
          console.warn('⚠️ Sesión expirada detectada al inicio. Limpiando datos.');
          this.logout(); // Limpia todo
          return null;
        }
      }

      // Validar que el usuario tenga los campos necesarios
      if (!user.id || !user.email || !user.rol) {
        console.warn('⚠️ Usuario en localStorage inválido');
        localStorage.removeItem('auth_user');
        return null;
      }

      return user;
    } catch (error) {
      console.error('❌ Error al parsear usuario de localStorage:', error);
      localStorage.removeItem('auth_user');
      return null;
    }
  }

  /**
   * Navegar según el rol del usuario
   */
  private navigateByRole(role: UserRole): void {
    console.log('🧭 Navegando según rol:', role);

    switch (role) {
      case UserRole.ADMINISTRADOR:
      case UserRole.TERAPEUTA:
        this.router.navigate(['/dashboard']);
        break;
      case UserRole.PACIENTE:
        this.router.navigate(['/calendario']);
        break;
      case UserRole.ALUMNO:
        //TODO: Definir ruta específica para alumnos
        this.router.navigate(['/calendario']);
        break;
      default:
        this.router.navigate(['/dashboard']);
    }
  }
}
