import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from '../../../core/services/users.service';
import { CalendarService } from '../../../core/services/calendar.service';
import { PaymentsService } from '../../../core/services/payments.service';
import { AuthService } from '../../../core/services/auth.service';
import { DateUtilService } from '../../../core/services/date-util.service';
import { UserRole } from '../../../core/models/enums';
import type { AppointmentSlot } from '../../../core/models/models';
import {
  formatDisplayDate,
  getUserRoleLabel,
  getUserStatusBadgeClass,
  getTicketStatusBadgeClass,
  getTicketStatusLabel,
  getPaymentStatusBadgeClass,
  getPaymentStatusLabel,
  formatMonto,
} from '../../../core/utils';


interface UserDetail {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  rol: UserRole;
  estado?: string;
  fechaRegistro?: Date;
  especializacion?: string;
  cedula?: string;
  folio?: string;
  idAlumno?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PaymentInfo {
  id: string;
  folio: string;
  monto: number;
  estado: string;
  fecha: Date;
}

/**
 * Componente dinámico para ver detalles de un usuario
 * Mostra información diferente según el rol:
 * - Terapeuta: sus citas agendadas
 * - Paciente: sus citas + pagos
 * - Admin: información completa del usuario
 */
@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.css'],
})
export class UserDetailComponent implements OnInit {
  private usersService = inject(UsersService);
  private calendarService = inject(CalendarService);
  private paymentsService = inject(PaymentsService);
  private authService = inject(AuthService);
  private dateUtilService = inject(DateUtilService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Estado
  isLoading = signal(false);
  error = signal<string | null>(null);
  user = signal<UserDetail | null>(null);
  appointments = signal<AppointmentSlot[]>([]);
  payments = signal<PaymentInfo[]>([]);

  // Computed properties
  userRole = computed(() => {
    const user = this.user();
    return user?.rol;
  });

  // Total de pagos pagados
  totalPagado = computed(() => {
    return this.payments()
      .filter((p) => p.estado === 'Pagado')
      .reduce((sum, p) => sum + p.monto, 0);
  });

  // Mostrar appointments (para Terapeuta y Paciente)
  shouldShowAppointments = computed(() => {
    const role = this.userRole();
    return role === UserRole.TERAPEUTA || role === UserRole.PACIENTE;
  });

  // Mostrar payments (solo para Paciente)
  shouldShowPayments = computed(() => {
    return this.userRole() === UserRole.PACIENTE;
  });

  ngOnInit(): void {
    this.cargarDetallesUsuario();
  }

  /**
   * Carga los detalles del usuario desde la API
   */
  cargarDetallesUsuario(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const userId = this.route.snapshot.paramMap.get('id');
    if (!userId) {
      this.error.set('ID de usuario no encontrado');
      this.isLoading.set(false);
      return;
    }

    // Cargar datos del usuario
    this.usersService.obtenerUsuarioPorId(Number(userId)).subscribe({
      next: (response: any) => {
        const userData = response.data as UserDetail;
        this.user.set(userData);

        // Cargar datos adicionales según el rol
        if (userData.rol === UserRole.TERAPEUTA) {
          this.cargarCitasDelTerapeuta(userData.id);
        } else if (userData.rol === UserRole.PACIENTE) {
          this.cargarCitasDelPaciente(userData.id);
          this.cargarPagosDelPaciente(userData.id);
        }

        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error al cargar usuario:', err);
        this.error.set('Error al cargar los detalles del usuario');
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Carga las citas del terapeuta
   */
  private cargarCitasDelTerapeuta(terapeutaId: number): void {
    this.calendarService.obtenerCitasPorTerapeuta(terapeutaId).subscribe({
      next: (response: any) => {
        this.appointments.set(response.data || []);
      },
      error: (err: any) => {
        console.error('Error al cargar citas del terapeuta:', err);
        // No mostrar error al usuario, solo en consola
      },
    });
  }

  /**
   * Carga las citas del paciente
   */
  private cargarCitasDelPaciente(pacienteId: number): void {
    this.calendarService.obtenerCitasPorPaciente(pacienteId).subscribe({
      next: (response: any) => {
        this.appointments.set(response.data || []);
      },
      error: (err: any) => {
        console.error('Error al cargar citas del paciente:', err);
      },
    });
  }

  /**
   * Carga los pagos del paciente
   */
  private cargarPagosDelPaciente(pacienteId: number): void {
    this.paymentsService.obtenerPagosPorPaciente(pacienteId).subscribe({
      next: (response: any) => {
        this.payments.set(response.data || []);
      },
      error: (err: any) => {
        console.error('Error al cargar pagos del paciente:', err);
      },
    });
  }

  // Navegación
  volver(): void {
    this.router.navigate(['/usuarios']);
  }

  // Helpers
  formatDate(date: Date): string {
    return formatDisplayDate(date);
  }

  getStatusBadge(estado: string): string {
    // Para estados genéricos, retorna el badge class directamente
    if (estado === 'Pagado' || estado === 'Completado') {
      return 'success';
    }
    if (estado === 'Agendado' || estado === 'Pendiente') {
      return 'warning';
    }
    if (estado === 'Cancelado' || estado === 'Rechazado') {
      return 'error';
    }
    return 'default';
  }

  getStatusText(estado: string): string {
    return estado || 'N/A';
  }

  getRoleText(rol: UserRole): string {
    return getUserRoleLabel(rol);
  }

  formatMonto(monto: number): string {
    return formatMonto(monto);
  }
}
