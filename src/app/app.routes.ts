import { Routes } from '@angular/router';
import { DashboardAdminComponent } from './features/dashboard/components/dashboard-admin.component';
import { PaymentsComponent } from './features/pagos/components/payments.component';
import { CalendarComponent } from './features/calendario/components/calendar/calendar.component';
import { CitaDetalleComponent } from './features/calendario/components/cita-detalle/cita-detalle.component';
import { UsersTableComponent } from './features/usuarios/components/users-table.component';
import { UserDetailComponent } from './features/usuarios/components/user-detail.component';
import { UserProfileComponent } from './features/perfil/components/user-profile.component';
import { LoginComponent } from './features/auth/components/login.component';
import { RegisterComponent } from './features/auth/components/register.component';
import { SpacesManagementComponent } from './features/admin/components/spaces-management/spaces-management.component';
import { BankAccountsManagementComponent } from './features/admin/components/bank-accounts-management/bank-accounts-management.component';
import { authGuard, roleGuard, guestGuard, permissionGuard } from './core/guards/guards';
import { UserRole } from './core/models/enums';

export const routes: Routes = [
  // ==========================================
  // RUTAS PÚBLICAS (con guestGuard)
  // ==========================================
  {
    path: 'login',
    loadComponent: () => LoginComponent,
    canActivate: [guestGuard], // Redirige si ya está autenticado
    title: 'Iniciar Sesión - MindCare',
  },
  {
    path: 'register',
    loadComponent: () => RegisterComponent,
    canActivate: [guestGuard], // Redirige si ya está autenticado
    title: 'Registro - MindCare',
  },

  // ==========================================
  // RUTAS PROTEGIDAS - SOLO AUTENTICADOS
  // ==========================================

  // Dashboard - Admin y Terapeuta
  {
    path: 'dashboard',
    loadComponent: () => DashboardAdminComponent,
    canActivate: [authGuard, roleGuard([UserRole.ADMINISTRADOR, UserRole.TERAPEUTA])],
    title: 'Dashboard - MindCare',
  },

  // Calendario - Todos los usuarios autenticados
  {
    path: 'calendario',
    loadComponent: () => CalendarComponent,
    canActivate: [authGuard],
    title: 'Calendario - MindCare',
  },

  // Detalle de Cita - Todos los usuarios autenticados
  {
    path: 'calendario/citas/:id',
    loadComponent: () => CitaDetalleComponent,
    canActivate: [authGuard],
    title: 'Detalle de Cita - MindCare',
  },

  // Perfil - Todos los usuarios autenticados
  {
    path: 'perfil',
    loadComponent: () => UserProfileComponent,
    canActivate: [authGuard],
    title: 'Perfil - MindCare',
  },

  // ==========================================
  // RUTAS RESTRINGIDAS POR ROL
  // ==========================================

  // Pagos - Admin y Paciente
  {
    path: 'pagos',
    loadComponent: () => PaymentsComponent,
    canActivate: [authGuard, roleGuard([UserRole.ADMINISTRADOR, UserRole.PACIENTE])],
    title: 'Pagos - MindCare',
  },

  // Usuarios - Solo Administradores (usando permissionGuard)
  {
    path: 'usuarios',
    loadComponent: () => UsersTableComponent,
    canActivate: [
      authGuard,
      permissionGuard('manageUsers'), // Más granular que roleGuard
    ],
    title: 'Usuarios - MindCare',
  },

  // Detalle de Usuario - Solo Administradores
  {
    path: 'usuarios/:id',
    loadComponent: () => UserDetailComponent,
    canActivate: [authGuard, permissionGuard('manageUsers')],
    title: 'Detalle de Usuario - MindCare',
  },

  // ==========================================
  // RUTAS DE ADMIN - GESTIÓN DE CATÁLOGOS
  // ==========================================

  // Espacios/Cubículos - Solo Administradores
  {
    path: 'admin/espacios',
    loadComponent: () => SpacesManagementComponent,
    canActivate: [authGuard, roleGuard([UserRole.ADMINISTRADOR])],
    title: 'Gestión de Espacios - MindCare',
  },

  // Cuentas Bancarias - Solo Administradores
  {
    path: 'admin/cuentas',
    loadComponent: () => BankAccountsManagementComponent,
    canActivate: [authGuard, roleGuard([UserRole.ADMINISTRADOR])],
    title: 'Gestión de Cuentas Bancarias - MindCare',
  },

  // ==========================================
  // RUTAS PARA ALUMNOS
  // ==========================================
  // {
  //   path: 'prestamos',
  //   loadComponent: () =>
  //     import('./features/prestamos/components/prestamos.component').then(
  //       (m) => m.PrestamosComponent
  //     ),
  //   canActivate: [authGuard, roleGuard([UserRole.ADMINISTRADOR, UserRole.ALUMNO])],
  //   title: 'Préstamos - MindCare',
  // },

  // // ==========================================
  // // RUTAS DE REPORTES
  // // ==========================================
  // {
  //   path: 'reportes',
  //   loadComponent: () =>
  //     import('./features/reportes/components/reportes.component').then((m) => m.ReportesComponent),
  //   canActivate: [authGuard, permissionGuard('viewReports')],
  //   title: 'Reportes - MindCare',
  // },

  // ==========================================
  // REDIRECCIONES
  // ==========================================
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
