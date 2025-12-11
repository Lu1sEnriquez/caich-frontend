import { Component, inject, input, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { BadgeComponent } from '../../ui/badge/badge.component';
import { NotificationPanelComponent } from '../../notifications/notification-panel/notification-panel.component';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationsService } from '../../../../core/services/notifications.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { MenuGroup } from '../../../../core/models/models';

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
  private notificationsService = inject(NotificationsService);

  // Trigger para obtener notificaciones (1 = fetch on init)
  private notifTrigger = signal(1);
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

  // Exponer el contador como computed para usar en la plantilla
  unreadCount = computed(() => (this.notifResource.value() as any)?.data ?? 0);

  // Usuario actual desde auth service
  currentUser = computed(() => this.authService.currentUser());
  currentUserName = computed(() => this.authService.currentUser()?.nombreCompleto || 'Usuario');

  // Estado del panel de notificaciones
  notificationsPanelIsOpen = computed(() => this.notificationsPanelOpen());

  toggleNotifications() {
    this.notificationsPanelOpen.update((v) => !v);
  }

  onLogoutClick(): void {
    this.logoutClick.emit();
  }
}
