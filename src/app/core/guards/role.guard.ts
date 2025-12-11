import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * RoleGuard - Protege rutas según el rol del usuario
 *
 * ¿Qué hace?
 * - Verifica si el usuario tiene uno de los roles permitidos
 * - Si SÍ: Permite el acceso
 * - Si NO: Redirige a dashboard
 *
 * Uso en rutas:
 * {
 *   path: 'usuarios',
 *   component: UsersComponent,
 *   canActivate: [
 *     authGuard,                          // Primero: ¿autenticado?
 *     roleGuard(['Administrador'])        // Segundo: ¿tiene el rol?
 *   ]
 * }
 */
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    console.log('🛡️ RoleGuard: Verificando rol');
    console.log('   Roles permitidos:', allowedRoles);
    console.log('   Rol del usuario:', authService.currentRole());

    const userRole = authService.currentRole();

    // 1. Si no hay rol, significa que no está autenticado
    if (!userRole) {
      console.log('❌ No hay rol (usuario no autenticado), redirigiendo a login');
      router.navigate(['/login']);
      return false;
    }

    // 2. Verificar si el rol del usuario está en la lista permitida
    if (allowedRoles.includes(userRole)) {
      console.log('✅ Rol permitido, acceso concedido');
      return true;
    }

    // 3. Rol no autorizado para esta ruta
    console.log('❌ Rol no autorizado para esta ruta');
    console.log('   Redirigiendo a dashboard');
    router.navigate(['/dashboard']);
    return false;
  };
};
