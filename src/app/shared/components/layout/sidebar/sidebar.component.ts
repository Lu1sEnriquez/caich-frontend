import { Component, inject, input, signal, computed, output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DrawerModule } from 'primeng/drawer'; // O 'primeng/sidebar' si usas v17
import { ButtonModule } from 'primeng/button';
import { BadgeComponent } from '../../ui/badge/badge.component';
import { NotificationPanelComponent } from '../../notifications/notification-panel/notification-panel.component';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationsService } from '../../../../core/services/notifications.service';
import { ReportsService } from '../../../../core/services/reports.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { MenuGroup } from '../../../../core/models/models';
import { UserRole } from '../../../../core/models/enums';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    DrawerModule, // Importante
    ButtonModule,
    BadgeComponent, 
    NotificationPanelComponent
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  // Usamos encapsulación None si necesitamos sobreescribir estilos de PrimeNG fácilmente, 
  // o usamos ::ng-deep en el CSS.
  encapsulation: ViewEncapsulation.None 
})
export class SidebarComponent {
  appName = input<string>('MindCare');
  menuGroups = input<MenuGroup[]>([]);
  userRole = input<string>('Paciente');
  logoutLabel = input<string>('Cerrar sesión');
  logoutClick = output<void>();

  // Controla la visibilidad del Drawer de PrimeNG
  drawerVisible = signal(false);

  authService = inject(AuthService);
  private router = inject(Router);
  private notificationsService = inject(NotificationsService);
  private reportsService = inject(ReportsService);

  // --- LÓGICA DE DATOS (Mantenemos tu lógica original) ---
  private notifTrigger = signal(1);
  private dashboardTrigger = signal(1);
  private notificationsPanelOpen = signal(false);

  private notifResource = rxResource({
    params: () => ({ trigger: this.notifTrigger() }),
    stream: ({ params }) => {
      if (params.trigger === 0) return of(null as any);
      return this.notificationsService.getUnreadCount();
    },
  });

  private dashboardResource = rxResource({
    params: () => ({ trigger: this.dashboardTrigger() }),
    stream: ({ params }) => {
      if (params.trigger === 0) return of(null as any);
      const role = this.authService.currentUser()?.rol;
      if (role === UserRole.ADMINISTRADOR || role === UserRole.TERAPEUTA) {
        return this.reportsService.obtenerDashboardAdmin();
      }
      return of(null as any);
    },
  });

  unreadCount = computed(() => (this.notifResource.value() as any)?.data ?? 0);
  
  importantItemsCount = computed(() => {
    const dashboardData = (this.dashboardResource.value() as any)?.data;
    if (!dashboardData) return 0;
    return (dashboardData.citasHoy ?? 0) + (dashboardData.pagosPendientes ?? 0);
  });

  totalNotifications = computed(() => this.unreadCount() + this.importantItemsCount());

  currentUser = computed(() => this.authService.currentUser());
  currentUserName = computed(() => this.authService.currentUser()?.nombreCompleto || 'Usuario');
  notificationsPanelIsOpen = computed(() => this.notificationsPanelOpen());

  // --- ACCIONES ---

  toggleDrawer() {
    this.drawerVisible.update(v => !v);
  }

  closeDrawer() {
    this.drawerVisible.set(false);
  }

  toggleNotifications() {
    this.notificationsPanelOpen.update((v) => !v);
    // Si abrimos notificaciones, cerramos el drawer principal para no saturar
    if (this.notificationsPanelOpen()) {
      this.closeDrawer();
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
    this.closeDrawer();
  }

  onLogoutClick(): void {
    this.logoutClick.emit();
    this.closeDrawer();
  }
}