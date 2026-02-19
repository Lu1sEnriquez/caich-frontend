import { Component, signal, computed, inject, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Agregar FormsModule
import { Router, ActivatedRoute } from '@angular/router';
import { CardComponent } from '../../../../shared/components/ui/card/card.component';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../../../shared/components/ui/badge/badge.component';
import type { AppointmentSlot, CalendarDay, TimeSlot } from '../../../../core/models/models';
import { AppointmentScheduleComponent } from '../appointment-schedule/appointment-schedule.component';
import { ScheduleConfigModalComponent } from '../schedule-config-modal/schedule-config-modal.component'; // Importar el modal
import { AppointmentsModalComponent } from '../appointments-modal/appointments-modal.component';
import { PaymentsModalComponent } from '../payments-modal/payments-modal.component';
import { CalendarService } from '../../../../core/services/calendar.service';
import { AuthService } from '../../../../core/services/auth.service';
import { formatDisplayDate } from '../../../../core/utils';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { TicketStatus, UserRole } from '../../../../core/models/enums';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, // Agregar FormsModule aqui
    CardComponent,
    ButtonComponent,
    BadgeComponent,
    AppointmentScheduleComponent,
    ScheduleConfigModalComponent, // Agregar el modal aqui
    AppointmentsModalComponent,
    PaymentsModalComponent,
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent {
  @ViewChild('appointmentScheduleSection') appointmentScheduleSection!: ElementRef;

  private calendarService = inject(CalendarService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  // Señales reactivas
  currentMonth = signal(new Date());
  selectedDate = signal<Date | null>(null);
  selectedEspacioId = signal<number>(1);

  // Triggers para recursos
  appointmentsTrigger = signal(1);
  statsTrigger = signal(1);
  horariosTrigger = signal(1);

  // Estados de UI
  showFilters = signal(false);
  showScheduleConfig = signal(false);
  showAppointmentsModal = signal(false);
  showPaymentsModal = signal(false);

  weekdays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  // Filtros - usar propiedades normales en lugar de signals para ngModel
  filters = {
    terapeuta: '',
    tipoCita: '',
    estado: '',
    espacio: '',
  };

  // Computed properties
  currentMonthName = computed(() => {
    const months = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    return months[this.currentMonth().getMonth()];
  });

  currentYear = computed(() => this.currentMonth().getFullYear());

  selectedDateFormatted = computed(() => {
    const date = this.selectedDate();
    if (!date) return 'Selecciona una fecha';

    const day = date.getDate();
    const month = date.toLocaleDateString('es', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  });

  isAdmin = computed(() => this.authService.hasRole(UserRole.ADMINISTRADOR));

  // RXResource para obtener citas del mes
  appointmentsResource = rxResource({
    params: () => ({
      trigger: this.appointmentsTrigger(),
      month: this.currentMonth(),
      filters: this.filters, // Usar el objeto filters normal
    }),
    stream: ({ params }) => {
      if (params.trigger === 0) return of(null);

      const startDate = new Date(params.month.getFullYear(), params.month.getMonth(), 1);
      const endDate = new Date(params.month.getFullYear(), params.month.getMonth() + 1, 0);

      return this.calendarService.getCitas({
        fechaInicio: startDate.toISOString().split('T')[0],
        fechaFin: endDate.toISOString().split('T')[0],
      });
    },
  });

  // RXResource para horarios disponibles
  horariosResource = rxResource({
    params: () => ({
      trigger: this.horariosTrigger(),
      espacioId: this.selectedEspacioId(),
      fecha: this.selectedDate(),
    }),
    stream: ({ params }) => {
      if (params.trigger === 0 || !params.fecha) return of(null);

      const fechaStr = params.fecha.toISOString().split('T')[0];
      return this.calendarService.getHorariosDisponibles(params.espacioId, fechaStr);
    },
  });

  // Computed: Citas mapeadas
  appointments = computed(() => {
    const response = this.appointmentsResource.value();
    if (!response?.data) return [];

    return response.data.map((dto) => this.calendarService.mapToAppointmentSlot(dto));
  });

  goToEspacios(): void {
    this.router.navigate(['/admin/espacios']);
  }

  // Computed: Próximas citas (próximas 2 semanas)
  upcomingAppointments = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoWeeksFromNow = new Date(today);
    twoWeeksFromNow.setDate(today.getDate() + 14);

    return this.appointments()
      .filter((apt) => {
        const aptDate = new Date(apt.fecha);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate >= today && aptDate <= twoWeeksFromNow;
      })
      .slice(0, 5);
  });

  // Computed: Citas del mes actual (para el modal)
  appointmentsThisMonth = computed(() => {
    const monthAppointments = this.appointments().filter((apt) => {
      const aptDate = new Date(apt.fecha);
      return (
        aptDate.getMonth() === this.currentMonth().getMonth() &&
        aptDate.getFullYear() === this.currentMonth().getFullYear()
      );
    });

    return monthAppointments.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  });

  // Computed: Indicadores rápidos del mes seleccionado
  monthIndicators = computed(() => {
    const appointments = this.appointmentsThisMonth();

    return {
      total: appointments.length,
      agendadas: appointments.filter((a: any) => a.estado === 'Agendado').length,
      completadas: appointments.filter((a: any) => a.estado === 'Completado').length,
      canceladas: appointments.filter((a: any) => a.estado === 'Cancelado').length,
    };
  });

  // Computed: Pagos pendientes del mes (adaptable según endpoint de pagos)
  paymentsThisMonth = computed(() => {
    // TODO: Aquí se integraría un endpoint de pagos reales
    // Por ahora devolvemos un array vacío
    // El formato esperado es: PaymentInfo[] del payments-modal.component
    return [];
  });

  // Computed: Horarios disponibles para la fecha seleccionada
  timeSlots = computed(() => {
    const response = this.horariosResource.value();
    if (!response?.data || !this.selectedDate()) return [];

    const slots: TimeSlot[] = [];
    response.data.forEach((timeRange) => {
      const [startTime, endTime] = timeRange.split('-');
      if (startTime && endTime) {
        slots.push({
          time: `${startTime} - ${endTime}`,
          status: 'Disponible',
        });
      }
    });

    // Horarios por defecto si no hay configuración
    if (slots.length === 0) {
      for (let h = 9; h <= 17; h++) {
        for (let m = 0; m < 60; m += 30) {
          const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          const nextTime = this.getNextTime(time);
          slots.push({
            time: `${time} - ${nextTime}`,
            status: 'Disponible',
          });
        }
      }
    }

    return slots;
  });

  // Computed: Estadísticas
  stats = computed(() => {
    const monthAppointments = this.appointments().filter((apt) => {
      const aptDate = new Date(apt.fecha);
      return (
        aptDate.getMonth() === this.currentMonth().getMonth() &&
        aptDate.getFullYear() === this.currentMonth().getFullYear()
      );
    });

    const horasReservadas = monthAppointments.reduce((total, apt) => {
      const start = this.timeToMinutes(apt.horaInicio);
      const end = this.timeToMinutes(apt.horaFin);
      return total + (end - start) / 60;
    }, 0);

    const pagosPendientes = monthAppointments.filter((apt) => apt.estado === TicketStatus.AGENDADO).length;

    return {
      citasEsteMes: monthAppointments.length,
      horasReservadas: Math.round(horasReservadas * 10) / 10,
      pagosPendientes,
    };
  });

  // Computed: Días del calendario con slots reales
  calendarDays = computed(() => {
    const year = this.currentMonth().getFullYear();
    const month = this.currentMonth().getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: CalendarDay[] = [];
    const appointmentsByDay = this.groupAppointmentsByDay();

    // Días del mes anterior
    const firstDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth: false,
        slots: 0,
        isToday: false,
        isSelected: false,
      });
    }

    // Días del mes actual
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      const selected = this.selectedDate();
      const isSelected = selected ? date.getTime() === selected.getTime() : false;

      const dateKey = date.toISOString().split('T')[0];
      const dayAppointments = appointmentsByDay[dateKey] || [];

      days.push({
        date,
        day,
        isCurrentMonth: true,
        slots: dayAppointments.length,
        isToday: date.getTime() === today.getTime(),
        isSelected,
      });
    }

    // Días del próximo mes
    const remaining = 42 - days.length;
    for (let day = 1; day <= remaining; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        day,
        isCurrentMonth: false,
        slots: 0,
        isToday: false,
        isSelected: false,
      });
    }

    return days;
  });

  constructor() {
    effect(() => {
      this.currentMonth();
      this.appointmentsTrigger.update((v) => v + 1);
      this.statsTrigger.update((v) => v + 1);
    });

    effect(() => {
      if (this.selectedDate()) {
        this.horariosTrigger.update((v) => v + 1);
      }
    });

    // Verificar si viene desde dashboard con cita para auto-seleccionar
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params['autoSelect'] === 'true' && params['appointmentId']) {
        // Buscar la cita en las citas cargadas y seleccionar su día
        setTimeout(() => {
          const appointmentId = params['appointmentId'];
          const appointment = this.appointments().find((apt: any) => apt.id === appointmentId);

          if (appointment) {
            const appointmentDate = new Date(appointment.fecha);
            appointmentDate.setHours(0, 0, 0, 0);

            // Auto-seleccionar el día
            const calendarDay = this.calendarDays().find(
              (day) => day.date.getTime() === appointmentDate.getTime()
            );

            if (calendarDay) {
              this.selectDay(calendarDay);
            }
          }
        }, 500);
      }
    });
  }

  // Métodos de navegación
  previousMonth() {
    const current = this.currentMonth();
    this.currentMonth.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  nextMonth() {
    const current = this.currentMonth();
    this.currentMonth.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  selectDay(day: CalendarDay) {
    if (day.isCurrentMonth) {
      this.selectedDate.set(day.date);
      // Scroll to appointment schedule with smooth animation
      setTimeout(() => {
        if (this.appointmentScheduleSection) {
          this.appointmentScheduleSection.nativeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }, 100);
    }
  }

  // Métodos de Filtros
  toggleFilters() {
    this.showFilters.update((v) => !v);
  }

  applyFilters() {
    this.appointmentsTrigger.update((v) => v + 1);
    this.showFilters.set(false);
  }

  clearFilters() {
    // Limpiar el objeto filters
    this.filters.terapeuta = '';
    this.filters.tipoCita = '';
    this.filters.estado = '';
    this.filters.espacio = '';
    this.appointmentsTrigger.update((v) => v + 1);
    this.showFilters.set(false);
  }

  // Métodos de Configuración de Horarios
  openScheduleConfig() {
    this.showScheduleConfig.set(true);
  }

  closeScheduleConfig() {
    this.showScheduleConfig.set(false);
  }

  saveScheduleConfig(config: any) {
    console.log('Guardando configuracion:', config);
    // Aquí llamarías al servicio para guardar la configuración
    this.calendarService.guardarConfiguracionHorarios(config).subscribe({
      next: () => {
        this.horariosTrigger.update((v) => v + 1);
        this.closeScheduleConfig();
      },
      error: (error) => {
        console.error('Error al guardar configuracion:', error);
      },
    });
  }

  // Métodos auxiliares
  private groupAppointmentsByDay(): Record<string, AppointmentSlot[]> {
    const groups: Record<string, AppointmentSlot[]> = {};

    this.appointments().forEach((apt) => {
      const dateKey = new Date(apt.fecha).toISOString().split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(apt);
    });

    return groups;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private getNextTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const nextMinutes = minutes + 30;
    if (nextMinutes === 60) {
      return `${(hours + 1).toString().padStart(2, '0')}:00`;
    }
    return `${hours.toString().padStart(2, '0')}:${nextMinutes.toString().padStart(2, '0')}`;
  }

  formatDate(date: Date): string {
    return formatDisplayDate(date);
  }

  // Helper para obtener la hora display de una cita
  getHoraDisplay(appointment: AppointmentSlot): string {
    return `${appointment.horaInicio} - ${appointment.horaFin}`;
  }

  // Helper para obtener modalidad (con valor por defecto)
  getModalidad(appointment: AppointmentSlot): string {
    return appointment.modalidad || 'Presencial';
  }

  // Navegar a detalles de la cita
  verDetalleCita(citaId: string): void {
    this.router.navigate(['/calendario/citas', citaId]);
  }

  // Abrir modal de citas del mes
  abrirModalCitasDelMes(): void {
    this.showAppointmentsModal.set(true);
  }

  // Cerrar modal de citas
  cerrarModalCitas(): void {
    this.showAppointmentsModal.set(false);
  }

  // Manejar selección de cita desde modal
  handleAppointmentSelectedFromModal(appointment: AppointmentSlot): void {
    this.verDetalleCita(appointment.id);
  }

  // Abrir modal de pagos pendientes
  abrirModalPagosPendientes(): void {
    this.showPaymentsModal.set(true);
  }

  // Cerrar modal de pagos
  cerrarModalPagos(): void {
    this.showPaymentsModal.set(false);
  }

  // Navegar a sección de pagos
  irASectionPagos(): void {
    this.router.navigate(['/pagos']);
  }

  // Métodos para estados
  getStatusBadge(estado: string): string {
    const statusMap: { [key: string]: string } = {
      Agendado: 'warning',
      Completado: 'success',
      Cancelado: 'error',
      NoAsistio: 'error',
    };
    return statusMap[estado] || 'default';
  }

  getStatusText(estado: string): string {
    const statusMap: { [key: string]: string } = {
      Agendado: 'Agendada',
      Completado: 'Completada',
      Cancelado: 'Cancelada',
      NoAsistio: 'No Asistió',
    };
    return statusMap[estado] || estado;
  }

  handleAppointmentSaved(appointment: AppointmentSlot) {
    console.log('Nueva cita guardada:', appointment);
    this.appointmentsTrigger.update((v) => v + 1);
    this.horariosTrigger.update((v) => v + 1);
  }

  updateHorarios() {
    this.horariosTrigger.update((v) => v + 1);
  }
}
