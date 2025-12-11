import { Injectable, inject } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private router = inject(Router);
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(
    null
  );

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Obtener token del localStorage
    const token = localStorage.getItem('auth_token');

    // Clonar request y agregar token si existe
    let authReq = req;
    if (token && !this.isAuthEndpoint(req.url)) {
      authReq = this.addToken(req, token);
    }

    // Continuar con el request
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si es error 401 (no autorizado) y no es un endpoint de auth
        if (error.status === 401 && !this.isAuthEndpoint(req.url)) {
          return this.handle401Error(authReq, next);
        }

        // Para cualquier otro error, propagarlo
        return throwError(() => error);
      })
    );
  }

  /**
   * Agrega el token de autenticación al request
   */
  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * Maneja errores 401 (no autorizado)
   * Intenta refrescar el token automáticamente
   */
  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Si ya estamos refrescando el token
    if (this.isRefreshing) {
      // Esperar a que termine el refresh
      return this.refreshTokenSubject.pipe(
        filter((token) => token !== null),
        take(1),
        switchMap((token) => {
          return next.handle(this.addToken(request, token!));
        })
      );
    }

    // Iniciar proceso de refresh
    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      // No hay refresh token, cerrar sesión
      this.isRefreshing = false;
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    // Llamar al endpoint de refresh
    // Nota: Inyectamos AuthService de forma lazy para evitar dependencias circulares
    const authService = inject(AuthService);

    return authService.refreshToken().pipe(
      switchMap((response) => {
        this.isRefreshing = false;
        this.refreshTokenSubject.next(response.accessToken);

        // Reintentar el request original con el nuevo token
        return next.handle(this.addToken(request, response.accessToken));
      }),
      catchError((error) => {
        this.isRefreshing = false;
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Verifica si la URL es un endpoint de autenticación
   */
  private isAuthEndpoint(url: string): boolean {
    const authEndpoints = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];
    return authEndpoints.some((endpoint) => url.includes(endpoint));
  }

  /**
   * Cierra sesión y redirige al login
   */
  private logout(): void {
    console.log('🚪 Token expirado, cerrando sesión...');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
    this.router.navigate(['/login']);
  }
}
