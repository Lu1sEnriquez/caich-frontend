// ============================================
// AUTH GUARD - Mejorado
// ============================================

import { inject } from '@angular/core';
import {
  Router,
  CanActivateFn,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
// import { ErrorHandlerService } from '../services/error-handler.service';

/**
 * Guard de autenticación mejorado
 * - Redirige según el estado de autenticación
 * - Guarda la URL de destino para redirigir después del login
 * - Muestra mensajes informativos
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const errorHandler = inject(ErrorHandlerService);

  console.log('AuthGuard: Verificando autenticacion');
  console.log('   Ruta solicitada:', state.url);

  // Verificar si está autenticado
  if (authService.isAuthenticatedSync()) {
    console.log('Usuario autenticado, permitiendo acceso');
    return true;
  }

  // No autenticado
  console.log('Usuario NO autenticado, redirigiendo a /login');

  // Mostrar mensaje al usuario
  errorHandler.showWarning('Acceso denegado', 'Debes iniciar sesión para acceder a esta página');

  // Guardar la URL a la que quería ir
  const returnUrl = state.url;
  console.log('   Guardando URL destino:', returnUrl);

  // Redirigir a login con returnUrl
  router.navigate(['/login'], {
    queryParams: { returnUrl },
  });

  return false;
};

// ============================================
// ROLE GUARD - Mejorado
// ============================================

import { UserRole } from '../models/enums';

/**
 * Guard de rol mejorado
 * - Verifica múltiples roles permitidos
 * - Redirige inteligentemente según el rol del usuario
 * - Muestra mensajes de error claros
 */
export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const errorHandler = inject(ErrorHandlerService);

    console.log('🛡️ RoleGuard: Verificando rol');
    console.log('   Roles permitidos:', allowedRoles);

    const userRole = authService.currentRole();
    console.log('   Rol del usuario:', userRole);

    // 1. Si no hay rol, redirigir a login
    if (!userRole) {
      console.log('No hay rol (usuario no autenticado)');
      errorHandler.showWarning(
        'Acceso denegado',
        'Debes iniciar sesión para acceder a esta página'
      );
      router.navigate(['/login'], {
        queryParams: { returnUrl: state.url },
      });
      return false;
    }

    // 2. Verificar si el rol está permitido
    if (allowedRoles.includes(userRole)) {
      console.log('Rol permitido, acceso concedido');
      return true;
    }

    // 3. Rol no autorizado - redirigir inteligentemente
    console.log('Rol no autorizado para esta ruta');

    // Mostrar mensaje al usuario
    errorHandler.showWarning(
      'Acceso denegado',
      `No tienes permisos para acceder a esta página. Tu rol actual es: ${userRole}`
    );

    // Redirigir según el rol
    const redirectRoute = getDefaultRouteForRole(userRole);
    console.log('   Redirigiendo a:', redirectRoute);
    router.navigate([redirectRoute]);

    return false;
  };
};

/**
 * Obtiene la ruta por defecto según el rol
 */
function getDefaultRouteForRole(role: UserRole): string {
  switch (role) {
    case UserRole.ADMINISTRADOR:
    case UserRole.TERAPEUTA:
      return '/dashboard';
    case UserRole.PACIENTE:
      return '/calendario';
    case UserRole.ALUMNO:
      return '/calendario';
    default:
      return '/dashboard';
  }
}

// ============================================
// GUEST GUARD - Para rutas públicas
// ============================================

/**
 * Guard para rutas públicas (login, register)
 * - Si ya está autenticado, redirige al dashboard
 * - Evita que usuarios autenticados vean login/register
 */
export const guestGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🛡️ GuestGuard: Verificando si es invitado');

  // Si está autenticado, redirigir al dashboard
  if (authService.isAuthenticatedSync()) {
    console.log('Usuario ya autenticado, redirigiendo a dashboard');
    const role = authService.currentRole();
    const redirectRoute = role ? getDefaultRouteForRole(role) : '/dashboard';
    router.navigate([redirectRoute]);
    return false;
  }

  console.log('Usuario no autenticado, permitiendo acceso a ruta publica');
  return true;
};

// ============================================
// PERMISSION GUARD - Para permisos específicos
// ============================================

import {
  canManageUsers,
  canManagePayments,
  canManageAppointments,
  canViewReports,
} from '../models/enums';
import { ErrorHandlerService } from '../services/errorHandler.service';

export type Permission = 'manageUsers' | 'managePayments' | 'manageAppointments' | 'viewReports';

/**
 * Guard de permisos específicos
 * - Verifica permisos granulares
 * - Más flexible que roleGuard
 */
export const permissionGuard = (permission: Permission): CanActivateFn => {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const errorHandler = inject(ErrorHandlerService);

    console.log('🛡️ PermissionGuard: Verificando permiso:', permission);

    const userRole = authService.currentRole();

    if (!userRole) {
      console.log('No hay rol');
      errorHandler.showWarning('Acceso denegado', 'Debes iniciar sesión');
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    let hasPermission = false;

    switch (permission) {
      case 'manageUsers':
        hasPermission = canManageUsers(userRole);
        break;
      case 'managePayments':
        hasPermission = canManagePayments(userRole);
        break;
      case 'manageAppointments':
        hasPermission = canManageAppointments(userRole);
        break;
      case 'viewReports':
        hasPermission = canViewReports(userRole);
        break;
    }

    if (hasPermission) {
      console.log('Permiso concedido');
      return true;
    }

    console.log('Permiso denegado');
    errorHandler.showWarning(
      'Acceso denegado',
      'No tienes los permisos necesarios para realizar esta acción'
    );

    const redirectRoute = getDefaultRouteForRole(userRole);
    router.navigate([redirectRoute]);
    return false;
  };
};
