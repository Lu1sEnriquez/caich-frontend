import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * AuthGuard - Protege rutas que requieren autenticación
 *
 * ¿Qué hace?
 * - Verifica si el usuario está autenticado
 * - Si SÍ: Permite el acceso a la ruta
 * - Si NO: Redirige a /login
 *
 * Uso en rutas:
 * {
 *   path: 'dashboard',
 *   component: DashboardComponent,
 *   canActivate: [authGuard]  // ← Protegida
 * }
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('AuthGuard: Verificando autenticacion');
  console.log('   Ruta solicitada:', state.url);
  console.log('   Usuario actual:', authService.currentUser());

  // Verificar si está autenticado
  if (authService.isAuthenticatedSync()) {
    console.log('Usuario autenticado, permitiendo acceso');
    return true; // ← Permite navegar a la ruta
  }

  // No autenticado, redirigir a login
  console.log('Usuario NO autenticado, redirigiendo a /login');
  console.log('   Guardando URL destino:', state.url);

  // Guardar la URL a la que quería ir para redirigir después del login
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url },
  });

  return false; // ← Bloquea la navegación
};
