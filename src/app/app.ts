import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { SidebarComponent } from './shared/components/layout/sidebar/sidebar.component';
import { AuthService } from './core/services/auth.service';
import { MenuGroup } from './core/models/models';
import { UserRole } from './core/models/enums';
import { ErrorModalComponent } from './shared/components/ui/error-modal/errorModal.component';
import { ConfirmationModalComponent } from './shared/components/modals/confirmation/confirmation-modal.component';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    SidebarComponent,
    ErrorModalComponent,
    ConfirmationModalComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('MindCare');

  // Inyectar servicios
  authService = inject(AuthService);
  private router = inject(Router);

  // Track de la ruta actual
  private currentRoute = signal('');
  // SEÑAL PARA CONTROLAR EL MODAL DE LOGOUT
  showLogoutModal = signal(false);

  constructor() {
    // Suscribirse a cambios de ruta
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const navEvent = event as NavigationEnd;
        this.currentRoute.set(navEvent.urlAfterRedirects);
        console.log('📍 Navegación:', navEvent.urlAfterRedirects);
      });
  }
  openLogoutModal() {
    this.showLogoutModal.set(true);
  }

  // 5. MÉTODO PARA CONFIRMAR EL LOGOUT (Lo llamará el Modal)
  confirmLogout() {
    this.showLogoutModal.set(false);
    this.authService.logout();
  }

  // Menú del sidebar adaptado según el rol
  menuGroups = computed<MenuGroup[]>(() => {
    const role = this.authService.currentRole();

    if (!role) return [];

    // Menú para Administradores
    if (role === UserRole.ADMINISTRADOR) {
      return [
        {
          title: 'General',
          items: [
            {
              label: 'Dashboard',
              route: '/dashboard',
              icon: '📊',
            },
            {
              label: 'Calendario',
              route: '/calendario',
              icon: '📅',
            },
            {
              label: 'Pagos',
              route: '/pagos',
              icon: '💳',
            },
            {
              label: 'Usuarios',
              route: '/usuarios',
              icon: '👥',
            },
            {
              label: 'Perfil',
              route: '/perfil',
              icon: '👤',
            },
          ],
        },
      ];
    }

    // Menú para Terapeutas
    if (role === UserRole.TERAPEUTA) {
      return [
        {
          title: 'General',
          items: [
            {
              label: 'Dashboard',
              route: '/dashboard',
              icon: '📊',
            },
            {
              label: 'Calendario',
              route: '/calendario',
              icon: '📅',
            },
            {
              label: 'Perfil',
              route: '/perfil',
              icon: '👤',
            },
          ],
        },
      ];
    }

    // Menú para Pacientes
    if (role === UserRole.PACIENTE) {
      return [
        {
          title: 'General',
          items: [
            {
              label: 'Mis Citas',
              route: '/calendario',
              icon: '📅',
            },
            {
              label: 'Mis Pagos',
              route: '/pagos',
              icon: '💳',
            },
            {
              label: 'Perfil',
              route: '/perfil',
              icon: '👤',
            },
          ],
        },
      ];
    }

    // Menú para Alumnos
    if (role === UserRole.ALUMNO) {
      //TODO: Definir menú específico para alumnos
      return [
        {
          title: 'General',
          items: [
            {
              label: 'Mis Préstamos',
              route: '/prestamos',
              icon: '📦',
            },
            {
              label: 'Calendario',
              route: '/calendario',
              icon: '📅',
            },
            {
              label: 'Perfil',
              route: '/perfil',
              icon: '👤',
            },
          ],
        },
      ];
    }

    return [];
  });

  /**
   * Verifica si debe mostrar el sidebar
   */
  shouldShowSidebar = computed(() => {
    const route = this.currentRoute();
    const isAuthenticated = this.authService.isAuthenticated();

    // No mostrar sidebar en rutas de autenticación
    const authRoutes = ['/login', '/register'];
    const isAuthRoute = authRoutes.some((r) => route.startsWith(r));

    return isAuthenticated && !isAuthRoute;
  });
}
