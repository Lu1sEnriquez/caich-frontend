import { Component, signal, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsService } from '../../../../core/services/notifications.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { formatDisplayDate } from '../../../../core/utils';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-panel.component.html',
  styleUrls: ['./notification-panel.component.css'],
})
export class NotificationPanelComponent {
  isOpen = input(false);
  closed = output<void>();
  private notificationsService = inject(NotificationsService);
  private triggerNotifications = signal(1);

  // Obtener todas las notificaciones
  notificationsResource = rxResource({
    params: () => ({ trigger: this.triggerNotifications() }),
    stream: ({ params }) => {
      if (params.trigger === 0) return of(null);
      return this.notificationsService.getAllNotifications().pipe(
        catchError((error) => {
          console.error('Error cargando notificaciones:', error);
          return of(null);
        })
      );
    },
  });

  notifications = computed(() => {
    const response = this.notificationsResource.value();
    return response?.data || [];
  });

  unreadCount = computed(() => {
    return this.notifications().filter((n: any) => !n.leida).length;
  });

  // Agrupar por tipo
  notificationsByType = computed(() => {
    const notifs = this.notifications();
    const types: Record<string, any[]> = {};
    notifs.forEach((n: any) => {
      if (!types[n.tipo]) types[n.tipo] = [];
      types[n.tipo].push(n);
    });
    return types;
  });

  getNotificationIcon(tipo: string): string {
    const icons: Record<string, string> = {
      PAGO: '💳',
      CITA: '📅',
      USUARIO: '👤',
      SISTEMA: '⚙️',
      ALERTA: '⚠️',
      EXITO: '✅',
    };
    return icons[tipo] || '📢';
  }

  getNotificationClass(tipo: string): string {
    const classes: Record<string, string> = {
      PAGO: 'notification-payment',
      CITA: 'notification-appointment',
      USUARIO: 'notification-user',
      SISTEMA: 'notification-system',
      ALERTA: 'notification-alert',
      EXITO: 'notification-success',
    };
    return classes[tipo] || 'notification-default';
  }

  markAsRead(notificacionId: number) {
    this.notificationsService.markAsRead(notificacionId).subscribe({
      next: () => {
        this.triggerNotifications.update((v) => v + 1);
      },
      error: (error) => console.error('Error:', error),
    });
  }

  markAllAsRead() {
    this.notificationsService.markAllAsRead().subscribe({
      next: () => {
        this.triggerNotifications.update((v) => v + 1);
      },
      error: (error) => console.error('Error:', error),
    });
  }

  formatDate(date: string): string {
    return formatDisplayDate(new Date(date));
  }
}

