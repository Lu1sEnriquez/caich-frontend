import { Component, inject, input, signal, computed, output, HostListener, ElementRef } from '@angular/core';
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
  collapsedChange = output<boolean>();

  // Estado del sidebar colapsado (inicia colapsado para ser menos intrusivo)
  isCollapsed = signal(true);

  authService = inject(AuthService);
  private router = inject(Router);
  private notificationsService = inject(NotificationsService);
  private reportsService = inject(ReportsService);
  private elementRef = inject(ElementRef);

  // Timeout para auto-collapse
  private collapseTimeoutId: any = null;

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

  /**
   * Toggle del estado colapsado del sidebar
   */
  toggleSidebar(): void {
    this.isCollapsed.update(v => !v);
    this.collapsedChange.emit(this.isCollapsed());
  }

  /**
   * Expandir sidebar (para hover trigger)
   */
  expandSidebar(): void {
    // Cancelar cualquier timeout de auto-collapse pendiente
    if (this.collapseTimeoutId) {
      clearTimeout(this.collapseTimeoutId);
      this.collapseTimeoutId = null;
    }

    if (this.isCollapsed()) {
      this.isCollapsed.set(false);
      this.collapsedChange.emit(false);
    }
  }

  /**
   * Colapsar sidebar (para click fuera)
   */
  collapseSidebar(): void {
    if (!this.isCollapsed()) {
      this.isCollapsed.set(true);
      this.collapsedChange.emit(true);
    }
  }

  /**
   * Cuando el mouse entra al sidebar
   */
  onSidebarMouseEnter(): void {
    // Cancelar auto-collapse si estaba programado
    if (this.collapseTimeoutId) {
      clearTimeout(this.collapseTimeoutId);
      this.collapseTimeoutId = null;
    }

    // Expandir si está colapsado
    if (this.isCollapsed()) {
      this.expandSidebar();
    }
  }

  /**
   * Cuando el mouse sale del sidebar - auto-colapsar
   */
  onSidebarMouseLeave(): void {
    // NO colapsar si el panel de notificaciones está abierto
    if (this.notificationsPanelOpen()) {
      return;
    }

    // Auto-colapsar después de un pequeño delay
    if (this.collapseTimeoutId) {
      clearTimeout(this.collapseTimeoutId);
    }

    this.collapseTimeoutId = setTimeout(() => {
      this.collapseSidebar();
    }, 300);
  }

  /**
   * Listener para clicks en el documento
   * Auto-colapsa el sidebar cuando se hace click fuera (con un pequeño delay)
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);

    // Si el click fue fuera del sidebar y el sidebar está expandido
    if (!clickedInside && !this.isCollapsed()) {
      // NO colapsar si el panel de notificaciones está abierto
      if (this.notificationsPanelOpen()) {
        return;
      }

      // Verificar que no fue un click en el hover trigger zone
      const target = event.target as HTMLElement;
      if (!target.classList.contains('sidebar-hover-trigger')) {
        // Colapsar inmediatamente en click (sin delay)
        this.collapseSidebar();
      }
    }
  }

  /**
   * Cancelar auto-collapse cuando el mouse vuelve al sidebar
   * NOTA: Ya no es necesario porque onSidebarMouseEnter lo maneja
   */
  /* @HostListener('mouseenter')
  onMouseEnter(): void {
    if (this.collapseTimeoutId) {
      clearTimeout(this.collapseTimeoutId);
      this.collapseTimeoutId = null;
    }
  } */

  /**
   * Listener para la tecla Escape - colapsa el sidebar
   */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (!this.isCollapsed()) {
      this.collapseSidebar();
    }
  }

  onLogoutClick(): void {
    this.logoutClick.emit();
  }
}
