import { Component, inject, input, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { of } from 'rxjs';
import { BadgeComponent } from '../../ui/badge/badge.component';
import { NotificationPanelComponent } from '../../notifications/notification-panel/notification-panel.component';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationsService } from '../../../../core/services/notifications.service';
import { ReportsService } from '../../../../core/services/reports.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { MenuGroup } from '../../../../core/models/models';
import { UserRole } from '../../../../core/models/enums';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, BadgeComponent, NotificationPanelComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  appName = input<string>('MindCare');
  menuGroups = input<MenuGroup[]>([]);
  userRole = input<string>('Paciente');
  userRoleLabel = input<string>('Rol actual:');
  showLogout = input<boolean>(true);
  logoutLabel = input<string>('Cerrar sesión');
  logoutClick = output<void>();

  authService = inject(AuthService);
  private router = inject(Router);
  private notificationsService = inject(NotificationsService);
  private reportsService = inject(ReportsService);

  // Trigger para obtener notificaciones (1 = fetch on init)
  private notifTrigger = signal(1);
  private dashboardTrigger = signal(1);
  private notificationsPanelOpen = signal(false);

  // rxResource para obtener contador de notificaciones no leídas
  private notifResource = rxResource({
    params: () => ({ trigger: this.notifTrigger() }),
    stream: ({ params }) => {
      // Si el trigger es 0, no ejecutar
      if (params.trigger === 0) return of(null as any);
      return this.notificationsService.getUnreadCount();
    },
  });

  // rxResource para obtener estadísticas del dashboard
  private dashboardResource = rxResource({
    params: () => ({ trigger: this.dashboardTrigger() }),
    stream: ({ params }) => {
      if (params.trigger === 0) return of(null as any);
      // Solo obtener si es admin o terapeuta
      const role = this.authService.currentUser()?.rol;
      if (role === UserRole.ADMINISTRADOR || role === UserRole.TERAPEUTA) {
        return this.reportsService.obtenerDashboardAdmin();
      }
      return of(null as any);
    },
  });

  // Exponer el contador como computed para usar en la plantilla
  unreadCount = computed(() => (this.notifResource.value() as any)?.data ?? 0);

  // Contador de items importantes: citas del día + pagos pendientes
  importantItemsCount = computed(() => {
    const dashboardData = (this.dashboardResource.value() as any)?.data;
    if (!dashboardData) return 0;

    const citasHoy = dashboardData.citasHoy ?? 0;
    const pagosPendientes = dashboardData.pagosPendientes ?? 0;

    return citasHoy + pagosPendientes;
  });

  // Total de notificaciones a mostrar: notificaciones no leídas + items importantes
  totalNotifications = computed(() => {
    return this.unreadCount() + this.importantItemsCount();
  });

  // Tooltip informativo
  notificationTooltip = computed(() => {
    const unread = this.unreadCount();
    const important = this.importantItemsCount();
    const dashboardData = (this.dashboardResource.value() as any)?.data;

    const parts: string[] = [];
    if (unread > 0) parts.push(`${unread} notificación${unread > 1 ? 'es' : ''}`);
    if (dashboardData) {
      if (dashboardData.citasHoy > 0) parts.push(`${dashboardData.citasHoy} cita${dashboardData.citasHoy > 1 ? 's' : ''} hoy`);
      if (dashboardData.pagosPendientes > 0) parts.push(`${dashboardData.pagosPendientes} pago${dashboardData.pagosPendientes > 1 ? 's' : ''} pendiente${dashboardData.pagosPendientes > 1 ? 's' : ''}`);
    }

    return parts.length > 0 ? parts.join(' • ') : 'Sin notificaciones';
  });

  // Usuario actual desde auth service
  currentUser = computed(() => this.authService.currentUser());
  currentUserName = computed(() => this.authService.currentUser()?.nombreCompleto || 'Usuario');

  // Estado del panel de notificaciones
  notificationsPanelIsOpen = computed(() => this.notificationsPanelOpen());

  toggleNotifications() {
    this.notificationsPanelOpen.update((v) => !v);
  }

  /**
   * Navegar a la dashboard
   */
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  onLogoutClick(): void {
    this.logoutClick.emit();
  }
}
