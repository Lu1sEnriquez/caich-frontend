import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import type { Payment, DashboardStats, CalendarDay } from '../../../core/models/models';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { ReportsService } from '../../../core/services/reports.service';
import { CardComponent } from '../../../shared/components/ui/card';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { InfoModalComponent, ModalAction } from '../../../shared/components/modal/info-modal.component';
import { TicketsService } from '../../../core/services/tickets.service';
import { CalendarService } from '../../../core/services/calendar.service';
import { UsersService } from '../../../core/services/users.service';
import { PaymentStatus } from '../../../core/models/enums';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardComponent,
    ButtonComponent,
    InfoModalComponent,
  ],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css'],
})
export class DashboardAdminComponent {
  currentMonth = signal(new Date()); // Fecha actual sincronizada
  selectedDay = signal<CalendarDay | null>(null);

  weekdays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  private reportsService = inject(ReportsService);
  private ticketsService = inject(TicketsService);
  private calendarService = inject(CalendarService);
  private usersService = inject(UsersService);
  private router = inject(Router);

  private dashboardTrigger = signal(1);
  private paymentsTrigger = signal(1);
  private appointmentsTrigger = signal(1);
  private newPatientsTrigger = signal(1);

  // Modales
  showCitasHoyModal = signal(false);
  showPagosPendientesModal = signal(false);
  showNuevosPacientesModal = signal(false);
  showCitasMesModal = signal(false);

  // Obtener datos del dashboard desde la API
  dashboardResource = rxResource({
    params: () => ({ trigger: this.dashboardTrigger() }),
    stream: ({ params }) => {
      if (params.trigger === 0) return of(null);
      return this.reportsService.obtenerDashboardAdmin().pipe(
        catchError((error) => {
          console.error('Error cargando dashboard:', error);
          return of(null);
        })
      );
    },
  });

  // Obtener pagos pendientes desde la API
  paymentsResource = rxResource({
    params: () => ({ trigger: this.paymentsTrigger() }),
    stream: ({ params }) => {
      if (params.trigger === 0) return of(null);

      return this.ticketsService.getTickets({ estadoPago: PaymentStatus.PENDIENTE }).pipe(
        catchError((error) => {
          console.error('Error cargando pagos:', error);
          return of({
            status: 'error',
            message: error.message || 'Error al cargar pagos',
            data: {
              content: [],
              totalElements: 0,
              totalPages: 0,
              size: 0,
              number: 0,
              first: true,
              last: true,
              empty: true,
            },
          } as any);
        })
      );
    },
  });

  // Obtener citas del mes actual
  appointmentsThisMonthResource = rxResource({
    params: () => ({ trigger: this.appointmentsTrigger(), month: this.currentMonth() }),
    stream: ({ params }) => {
      if (params.trigger === 0) return of(null);

      const startDate = new Date(params.month.getFullYear(), params.month.getMonth(), 1);
      const endDate = new Date(params.month.getFullYear(), params.month.getMonth() + 1, 0);

      return this.calendarService.getCitas({
        fechaInicio: startDate.toISOString().split('T')[0],
        fechaFin: endDate.toISOString().split('T')[0],
      }).pipe(
        catchError((error) => {
          console.error('Error cargando citas:', error);
          return of(null);
        })
      );
    },
  });

  // Obtener nuevos pacientes
  newPatientsResource = rxResource({
    params: () => ({ trigger: this.newPatientsTrigger() }),
    stream: ({ params }) => {
      if (params.trigger === 0) return of(null);

      return this.usersService.getAllUsers({ size: 10 }).pipe(
        catchError((error) => {
          console.error('Error cargando pacientes:', error);
          return of(null);
        })
      );
    },
  });

  // Stats del dashboard
  stats = computed<DashboardStats>(() => {
    const data = this.dashboardResource.value()?.data;

    if (!data) {
      return {
        citasHoy: 0,
        pagosPendientes: 0,
        nuevosPacientes: 0,
        citasEsteMes: 0,
        horasReservadas: 0,
        prestamosActivos: 0,
        prestamosVencidos: 0,
        productosStockBajo: 0,
        productosSinStock: 0,
        ingresosMes: 0,
      };
    }

    return {
      citasHoy: data.citasHoy ?? 0,
      pagosPendientes: data.pagosPendientes ?? 0,
      nuevosPacientes: data.nuevosPacientes ?? 0,
      citasEsteMes: data.citasEsteMes ?? 0,
      horasReservadas: 0,
      prestamosActivos: data.prestamosActivos ?? 0,
      prestamosVencidos: data.prestamosVencidos ?? 0,
      productosStockBajo: data.productosStockBajo ?? 0,
      productosSinStock: data.productosSinStock ?? 0,
      ingresosMes: data.ingresosMes ?? 0,
    };
  });

  // Pagos pendientes mapeados
  pendingPayments = computed(() => {
    const response = this.paymentsResource.value();
    const responseData = response as any;

    if (!responseData?.data) {
      console.warn('Sin datos de pagos');
      return [];
    }

    const content = responseData.data.content || [];

    if (!Array.isArray(content)) {
      console.warn('content no es un array');
      return [];
    }

    return content
      .slice(0, 5)
      .map((ticket: any) => ({
        id: ticket.ticketId,
        folio: ticket.folio,
        paciente: ticket.pacienteNombre,
        monto: ticket.costoTotal || 0,
        fecha: new Date(ticket.fecha),
        status: ticket.estadoPago,
      }));
  });

  // Nuevos pacientes
  newPatients = computed(() => {
    const response = this.newPatientsResource.value();
    if (!response?.data?.content) return [];

    return response.data.content
      .filter((u: any) => u.rol === 'PACIENTE')
      .slice(0, 10)
      .map((u: any) => ({
        id: u.id,
        nombreCompleto: u.nombreCompleto,
        email: u.email,
      }));
  });

  // Citas del mes actual
  appointmentsThisMonth = computed(() => {
    const response = this.appointmentsThisMonthResource.value();
    if (!response?.data) return [];

    return response.data.map((dto: any) => this.calendarService.mapToAppointmentSlot(dto));
  });

  // Estadisticas de citas del mes
  appointmentsStats = computed(() => {
    const appointments = this.appointmentsThisMonth();

    return {
      agendadas: appointments.filter((a: any) => a.estado === 'Agendado').length,
      completadas: appointments.filter((a: any) => a.estado === 'Completado').length,
      canceladas: appointments.filter((a: any) => a.estado === 'Cancelado').length,
    };
  });

  // Dias del calendario
  calendarDays = computed(() => {
    const year = this.currentMonth().getFullYear();
    const month = this.currentMonth().getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: CalendarDay[] = [];
    const appointmentsByDay = this.groupAppointmentsByDay();

    // Days from previous month
    const firstDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date,
        day: date.getDate(),
        slots: 0,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);

      const dateKey = date.toISOString().split('T')[0];
      const dayAppointments = appointmentsByDay[dateKey] || [];

      days.push({
        date,
        day,
        slots: dayAppointments.length,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
      });
    }

    // Days from next month
    const remaining = 42 - days.length;
    for (let day = 1; day <= remaining; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        day,
        slots: 0,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  });

  // Citas del dia seleccionado
  selectedDayAppointments = computed(() => {
    if (!this.selectedDay()) return [];

    const selected = this.selectedDay()!;
    const dateKey = selected.date.toISOString().split('T')[0];
    const appointmentsByDay = this.groupAppointmentsByDay();

    return appointmentsByDay[dateKey] || [];
  });

  previousMonth() {
    const current = this.currentMonth();
    this.currentMonth.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  nextMonth() {
    const current = this.currentMonth();
    this.currentMonth.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  selectCalendarDay(day: CalendarDay) {
    if (day.isCurrentMonth && day.slots > 0) {
      this.selectedDay.set(day);
    }
  }

  formatSelectedDay(): string {
    const day = this.selectedDay();
    if (!day) return '';

    const dayName = day.date.toLocaleDateString('es', { weekday: 'long' });
    const date = day.date.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${date}`;
  }

  getTotalPendingAmount(): number {
    return this.pendingPayments().reduce((sum, payment) => sum + payment.monto, 0);
  }

  private groupAppointmentsByDay(): Record<string, any[]> {
    const groups: Record<string, any[]> = {};

    this.appointmentsThisMonth().forEach((apt: any) => {
      const dateKey = new Date(apt.fecha).toISOString().split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(apt);
    });

    return groups;
  }

  // Métodos de navegación
  goToPagos() {
    this.router.navigate(['/pagos']);
  }

  goToCalendario() {
    this.router.navigate(['/calendario']);
  }

  goToUsuarios() {
    this.router.navigate(['/usuarios']);
  }

  goToCalendarWithAppointment(appointmentId: string) {
    // Navegar al calendario con parámetro del día seleccionado
    this.router.navigate(['/calendario'], {
      queryParams: {
        appointmentId: appointmentId,
        autoSelect: true
      }
    });
  }

  formatMonthYear(date: Date): string {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  refreshDashboard() {
    console.log('Refrescando dashboard...');
    this.dashboardTrigger.update((v) => v + 1);
    this.paymentsTrigger.update((v) => v + 1);
    this.appointmentsTrigger.update((v) => v + 1);
    this.newPatientsTrigger.update((v) => v + 1);
  }

  // Handlers para clicks en stat-cards
  handleCitasHoyClick() {
    const count = this.stats().citasHoy;
    if (count > 0) {
      // Abrir modal con detalles
      this.showCitasHoyModal.set(true);
    } else {
      // Navegar al calendario para agendar
      this.goToCalendario();
    }
  }

  handlePagosPendientesClick() {
    const count = this.stats().pagosPendientes;
    if (count > 0) {
      // Navegar directamente a pagos con filtro pendientes
      this.router.navigate(['/pagos'], {
        queryParams: { estado: 'PENDIENTE' }
      });
    }
  }

  handleNuevosPacientesClick() {
    const count = this.stats().nuevosPacientes;
    if (count > 0) {
      // Abrir modal con lista
      this.showNuevosPacientesModal.set(true);
    } else {
      this.goToUsuarios();
    }
  }

  handleCitasMesClick() {
    // Abrir modal con estadísticas
    this.showCitasMesModal.set(true);
  }

  // Acciones de modales
  getCitasHoyActions(): ModalAction[] {
    return [
      {
        label: 'Cerrar',
        variant: 'outline',
        action: () => this.showCitasHoyModal.set(false)
      },
      {
        label: 'Ver en calendario',
        variant: 'primary',
        action: () => {
          this.showCitasHoyModal.set(false);
          this.goToCalendario();
        }
      }
    ];
  }

  getNuevosPacientesActions(): ModalAction[] {
    return [
      {
        label: 'Cerrar',
        variant: 'outline',
        action: () => this.showNuevosPacientesModal.set(false)
      },
      {
        label: 'Ver todos',
        variant: 'primary',
        action: () => {
          this.showNuevosPacientesModal.set(false);
          this.goToUsuarios();
        }
      }
    ];
  }

  getCitasMesActions(): ModalAction[] {
    return [
      {
        label: 'Cerrar',
        variant: 'outline',
        action: () => this.showCitasMesModal.set(false)
      },
      {
        label: 'Ver calendario completo',
        variant: 'primary',
        action: () => {
          this.showCitasMesModal.set(false);
          this.goToCalendario();
        }
      }
    ];
  }

  // Obtener citas de hoy
  citasHoy = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = today.toISOString().split('T')[0];

    return this.appointmentsThisMonth().filter((apt: any) => {
      const aptDate = new Date(apt.fecha);
      aptDate.setHours(0, 0, 0, 0);
      const aptKey = aptDate.toISOString().split('T')[0];
      return aptKey === todayKey;
    });
  });

  // Obtener nuevos pacientes (últimos 5)
  nuevosPacientes = computed(() => {
    const response = this.newPatientsResource.value();
    if (!response?.data?.content) return [];

    return response.data.content.slice(0, 5).map((user: any) => ({
      id: user.id,
      nombre: user.nombreCompleto || 'Sin nombre',
      email: user.email || 'Sin email',
      rol: user.rol || 'PACIENTE',
      fechaCreacion: user.fechaCreacion
    }));
  });
}
