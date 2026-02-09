import {
  Component,
  signal,
  computed,
  input,
  output,
  ViewChild,
  ElementRef,
  AfterViewInit,
  inject,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { CardComponent } from '../../../../shared/components/ui/card/card.component';
import { AppointmentSlot, Cubiculo, DayScheduleConfig } from '../../../../core/models/models';
import {
  CalendarService,
  CrearCitaDTO,
  ActualizarCitaDTO,
} from '../../../../core/services/calendar.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DateUtilService } from '../../../../core/services/date-util.service';
import { UserRole } from '../../../../core/models/enums';
import { formatDisplayDate, formatDateForInput } from '../../../../core/utils';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { UsersService } from '../../../../core/services/users.service';

@Component({
  selector: 'app-appointment-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, CardComponent],
  templateUrl: './appointment-schedule.component.html',
  styleUrls: ['./appointment-schedule.component.css'],
})
export class AppointmentScheduleComponent implements AfterViewInit {
  @ViewChild('tableWrapper') tableWrapper!: ElementRef<HTMLDivElement>;

  private calendarService = inject(CalendarService);
  private authService = inject(AuthService);
  private dateUtilService = inject(DateUtilService);
  private usersService = inject(UsersService);

  // Inputs y Outputs
  selectedDate = input.required<Date>();
  appointmentSaved = output<AppointmentSlot>();

  // Exponer usuario actual para el template
  currentUser = computed(() => this.authService.currentUser());
  isAdminUser = computed(() => this.currentUser()?.rol === UserRole.ADMINISTRADOR);

  // Triggers para recursos reactivos
  espaciosTrigger = signal(1);
  configTrigger = signal(1);
  citasTrigger = signal(1);

  // Estado
  configMode = signal(false);
  showAppointmentDialog = signal(false);
  editingAppointment = signal<AppointmentSlot | null>(null);
  validationMessage = signal('');
  selectedEspacioId = signal<number | null>(null);
  selectedEspacioIdModel: number | null = null;

  // Separar horas temporales de las guardadas
  tempDisabledHours = signal<string[]>([]);

  // Formulario
  appointmentForm = signal({
    cubiculoId: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    pacienteId: '',
    pacienteNombre: '',
    terapeutaId: '',
    terapeutaNombre: '',
    materia: '',
    modalidad: 'Presencial' as 'Presencial' | 'Online',
    estado: 'Agendado' as 'Agendado' | 'Completado' | 'Cancelado' | 'NoAsistio',
    notas: '',
  });

  // RXResources
  espaciosResource = rxResource({
    params: () => ({ trigger: this.espaciosTrigger() }),
    stream: ({ params }) => {
      if (params.trigger === 0) return of(null);
      return this.calendarService.getEspacios();
    },
  });

  citasResource = rxResource({
    params: () => ({
      trigger: this.citasTrigger(),
      fecha: this.selectedDate(),
    }),
    stream: ({ params }) => {
      if (params.trigger === 0) return of(null);
      const fechaStr = params.fecha.toISOString().split('T')[0];
      return this.calendarService.getCitas({
        fechaInicio: fechaStr,
        fechaFin: fechaStr,
      });
    },
  });

  configResource = rxResource({
    params: () => ({
      trigger: this.configTrigger(),
      fecha: this.selectedDate(),
      espacioId: this.selectedEspacioId(),
    }),
    stream: ({ params }) => {
      if (params.trigger === 0 || !params.espacioId) return of(null);
      const fechaStr = params.fecha.toISOString().split('T')[0];
      return this.calendarService.getConfiguracionHorarios(fechaStr, params.espacioId);
    },
  });

  // Computeds
  cubiculos = computed(() => {
    const response = this.espaciosResource.value();
    if (!response?.data) return [];
    return response.data
      .map((dto) => this.calendarService.mapToCubiculo(dto))
      .filter((cubiculo) => cubiculo.disponible);
  });

  appointments = computed(() => {
    const response = this.citasResource.value();
    if (!response?.data) return [];
    return response.data.map((dto) => this.calendarService.mapToAppointmentSlot(dto));
  });

  // --- CAMBIO 1: Configuración siempre forzada a intervalo de 30 ---
  scheduleConfig = computed(() => {
    const response = this.configResource.value();

    const defaultConfig: DayScheduleConfig = {
      fecha: this.selectedDate(),
      horaInicio: 7,
      horaFin: 18,
      intervalo: 30, // Siempre 30 minutos
      horasDeshabilitadas: [],
      esHorarioDefault: true,
    };

    if (!response?.data) return defaultConfig;

    return {
      ...defaultConfig,
      horasDeshabilitadas: response.data.horasDeshabilitadas || [],
      esHorarioDefault: false, // Esto ya no afecta la visualización de columnas
      // Si la BD trae otro intervalo, lo sobrescribimos visualmente a 30 si así lo deseas,
      // o usa response.data.intervalo si la BD ya lo trae bien. 
      // Para este caso, forzamos 30:
      intervalo: 30
    };
  });

  // --- CAMBIO 2: Generación de horas siempre cada 30 min ---
  hours = computed(() => {
    const config = this.scheduleConfig();
    const hours: string[] = [];

    // Iteramos desde horaInicio hasta horaFin generando slots de :00 y :30
    for (let h = config.horaInicio; h < config.horaFin; h++) {
      const hourStr = h.toString().padStart(2, '0');
      
      // Slot en punto (ej. 07:00)
      hours.push(`${hourStr}:00`);
      
      // Slot y media (ej. 07:30)
      hours.push(`${hourStr}:30`);
    }

    return hours;
  });

  allTimeSlots = computed(() => this.hours());

  availableHours = computed(() => {
    return this.hours().filter((h) => !this.isHourDisabled(h));
  });

  currentTime = computed(() => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes() < 30 ? '00' : '30';
    return `${hours}:${minutes}`;
  });

  constructor() {
    effect(() => {
      this.selectedDate();
      setTimeout(() => this.scrollToCurrentTime(), 100);
    });

    effect(() => {
      this.selectedDate();
      this.citasTrigger.update((v) => v + 1);
    });

    effect(() => {
      if (this.selectedEspacioId()) {
        this.configTrigger.update((v) => v + 1);
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.scrollToCurrentTime(), 300);
  }

  scrollToCurrentTime(): void {
    if (!this.tableWrapper?.nativeElement) return;
    const currentHour = this.currentTime();
    const hourIndex = this.hours().findIndex((h) => h >= currentHour);
    if (hourIndex === -1) return;
    
    // Ajuste del scroll: 150 (ancho nombre cubículo) + index * ancho columna
    const scrollPosition = 150 + hourIndex * 100 - 150; 
    this.tableWrapper.nativeElement.scrollTo({
      left: Math.max(0, scrollPosition),
      behavior: 'smooth',
    });
  }

  // ============================================
  // MÉTODOS DE CONFIGURACIÓN
  // ============================================

  toggleConfigMode(espacioId?: number): void {
    if (!this.configMode()) {
      if (espacioId) {
        this.selectedEspacioId.set(espacioId);
      }
      this.tempDisabledHours.set([...this.scheduleConfig().horasDeshabilitadas]);
    }
    this.configMode.update((v) => !v);
  }

  toggleHourAvailability(hour: string): void {
    const disabled = this.tempDisabledHours();
    if (disabled.includes(hour)) {
      this.tempDisabledHours.set(disabled.filter((h) => h !== hour));
    } else {
      this.tempDisabledHours.set([...disabled, hour]);
    }
  }

  isHourDisabled(hour: string): boolean {
    if (this.configMode()) {
      return this.tempDisabledHours().includes(hour);
    }
    return this.scheduleConfig().horasDeshabilitadas.includes(hour);
  }

  saveConfig(): void {
    const espacioId = this.selectedEspacioId();
    if (!espacioId) {
      alert('❌ Debes seleccionar un espacio primero');
      return;
    }

    const configData = {
      espacioId: espacioId,
      fecha: this.selectedDate().toISOString().split('T')[0],
      horasDeshabilitadas: [...this.tempDisabledHours()],
    };

    this.calendarService.guardarConfiguracionHorarios(configData).subscribe({
      next: () => {
        this.configTrigger.update((v) => v + 1);
        this.configMode.set(false);
        console.log('✅ Configuración guardada:', configData.horasDeshabilitadas);
      },
      error: (error) => {
        console.error('❌ Error al guardar configuración:', error);
        alert('Error al guardar la configuración');
      },
    });
  }

  cancelConfig(): void {
    this.tempDisabledHours.set([...this.scheduleConfig().horasDeshabilitadas]);
    this.configMode.set(false);
    this.selectedEspacioId.set(null);
  }

  // ============================================
  // VALIDACIÓN Y CRUD
  // ============================================

  private validateTimeSlot(): boolean {
    const form = this.appointmentForm();
    const editing = this.editingAppointment();

    if (!form.cubiculoId || !form.horaInicio || !form.horaFin || !form.pacienteNombre || !form.terapeutaNombre || !form.materia) {
      this.validationMessage.set('Por favor completa todos los campos requeridos');
      return false;
    }

    const formStartMinutes = this.calendarService.timeToMinutes(form.horaInicio);
    const formEndMinutes = this.calendarService.timeToMinutes(form.horaFin);

    if (formEndMinutes <= formStartMinutes) {
      this.validationMessage.set('La hora de fin debe ser posterior a la hora de inicio');
      return false;
    }

    const conflict = this.appointments().find((apt) => {
      if (editing && apt.id === editing.id) return false;
      if (apt.cubiculoId !== form.cubiculoId) return false;
      if (!this.isSameDay(apt.fecha, new Date(form.fecha))) return false;

      const aptStart = this.calendarService.timeToMinutes(apt.horaInicio);
      const aptEnd = this.calendarService.timeToMinutes(apt.horaFin);

      return (
        (formStartMinutes < aptEnd && formEndMinutes > aptStart) ||
        (formStartMinutes <= aptStart && formEndMinutes >= aptEnd) ||
        (aptStart <= formStartMinutes && aptEnd >= formEndMinutes)
      );
    });

    if (conflict) {
      this.validationMessage.set(
        `⚠️ Ya existe una cita para "${conflict.pacienteNombre}" de ${conflict.horaInicio} a ${conflict.horaFin}.`
      );
      return false;
    }

    this.validationMessage.set('');
    return true;
  }

  saveAppointment(): void {
    if (!this.validateTimeSlot()) return;

    const form = this.appointmentForm();
    const editing = this.editingAppointment();
    const currentUser = this.authService.currentUser();
    const isAdmin = currentUser?.rol === UserRole.ADMINISTRADOR;
    const duracion = this.calendarService.calculateDuration(form.horaInicio, form.horaFin);

    const [y, m, d] = form.fecha.split('-').map(Number);
    const fechaCompleta = new Date(y, m - 1, d);
    const [hours, minutes] = form.horaInicio.split(':').map(Number);
    fechaCompleta.setHours(hours, minutes, 0, 0);

    if (editing) {
      this.performUpdateAppointment(editing, form, duracion, fechaCompleta);
    } else {
      this.performCreateAppointment(form, duracion, fechaCompleta, currentUser?.id, isAdmin);
    }
  }

  private performCreateAppointment(form: any, duracion: number, fechaCompleta: Date, currentUserId: string | undefined, isAdmin: boolean): void {
    const pacienteId = isAdmin ? Number(form.pacienteId) : currentUserId ? Number(currentUserId) : 1;
    const terapeutaId = Number(form.terapeutaId) || 1;
    const cuentaDestinoId = 1;

    const citaData: CrearCitaDTO = {
      espacioId: Number(form.cubiculoId),
      fecha: this.dateUtilService.toLocalISOString(fechaCompleta),
      duracion: duracion,
      pacienteId: pacienteId,
      terapeutaId: terapeutaId,
      materia: form.materia,
      modalidad: form.modalidad,
      notas: form.notas,
      montoPagado: 0,
      cuentaDestinoId: cuentaDestinoId,
    };

    this.calendarService.crearCita(citaData).subscribe({
      next: (response) => {
        const newAppointment = this.calendarService.mapToAppointmentSlot(response.data);
        this.citasTrigger.update((v) => v + 1);
        this.appointmentSaved.emit(newAppointment);
        this.closeDialog();
      },
      error: (error) => console.error('❌ Error al crear cita:', error),
    });
  }

  private performUpdateAppointment(editing: AppointmentSlot, form: any, duracion: number, fechaCompleta: Date): void {
    const pacienteId = Number(form.pacienteId) || 1;
    const terapeutaId = Number(form.terapeutaId) || 1;

    const updateData: ActualizarCitaDTO = {
      espacioId: Number(form.cubiculoId),
      fecha: this.dateUtilService.toLocalISOString(fechaCompleta),
      duracion: duracion,
      pacienteId: pacienteId,
      terapeutaId: terapeutaId,
      materia: form.materia,
      modalidad: form.modalidad,
      estadoTicket: this.mapEstadoToAPI(form.estado),
      notas: form.notas,
    };

    this.calendarService.actualizarCita(Number(editing.id), updateData).subscribe({
      next: (response) => {
        const updatedAppointment = this.calendarService.mapToAppointmentSlot(response.data);
        this.citasTrigger.update((v) => v + 1);
        this.appointmentSaved.emit(updatedAppointment);
        this.closeDialog();
        alert('✅ Cita actualizada correctamente.');
      },
      error: (error) => console.error('❌ Error al actualizar cita:', error),
    });
  }

  deleteAppointment(): void {
    const editing = this.editingAppointment();
    if (!editing) return;

    if (confirm(`¿Estás seguro de eliminar la cita?`)) {
      this.calendarService.eliminarCita(Number(editing.id)).subscribe({
        next: () => {
          this.citasTrigger.update((v) => v + 1);
          this.closeDialog();
        },
        error: (error) => {
            console.error(error);
            alert('Error al eliminar');
        },
      });
    }
  }

  openNewAppointment(): void {
    this.editingAppointment.set(null);
    const currentUser = this.authService.currentUser();
    const pacienteIdDefault = currentUser?.rol === UserRole.ADMINISTRADOR ? '' : currentUser?.id || '';

    this.appointmentForm.set({
      cubiculoId: '',
      fecha: this.formatDateForInput(this.selectedDate()),
      horaInicio: '07:00',
      horaFin: '08:00',
      pacienteId: pacienteIdDefault,
      pacienteNombre: '',
      terapeutaId: '',
      terapeutaNombre: '',
      materia: '',
      modalidad: 'Presencial',
      estado: 'Agendado',
      notas: '',
    });
    this.validationMessage.set('');
    this.showAppointmentDialog.set(true);
  }

  editAppointment(appointment: AppointmentSlot): void {
    this.editingAppointment.set(appointment);
    this.appointmentForm.set({
      cubiculoId: appointment.cubiculoId,
      fecha: this.formatDateForInput(appointment.fecha),
      horaInicio: appointment.horaInicio,
      horaFin: appointment.horaFin,
      pacienteId: appointment.pacienteId?.toString() || '',
      pacienteNombre: appointment.pacienteNombre,
      terapeutaId: appointment.terapeutaId?.toString() || '',
      terapeutaNombre: appointment.terapeutaNombre,
      materia: appointment.materia || '',
      modalidad: appointment.modalidad || 'Presencial',
      estado: appointment.estado,
      notas: appointment.notas || '',
    });
    this.validationMessage.set('');
    this.showAppointmentDialog.set(true);
  }

  closeDialog(): void {
    this.showAppointmentDialog.set(false);
    this.editingAppointment.set(null);
    this.validationMessage.set('');
  }

  // ============================================
  // MÉTODOS DE TABLA (Core de visualización)
  // ============================================

  shouldSkipCell(cubiculoId: string, hour: string): boolean {
    const date = this.selectedDate();
    const currentMinutes = this.calendarService.timeToMinutes(hour);

    return this.appointments().some((apt) => {
      if (apt.cubiculoId !== cubiculoId) return false;
      if (!this.isSameDay(apt.fecha, date)) return false;

      const startMinutes = this.calendarService.timeToMinutes(apt.horaInicio);
      const endMinutes = this.calendarService.timeToMinutes(apt.horaFin);

      // Si la celda actual está dentro de una cita, pero NO es la hora de inicio,
      // la saltamos porque la celda de inicio tendrá el colspan.
      return currentMinutes > startMinutes && currentMinutes < endMinutes;
    });
  }

  getAppointmentAt(cubiculoId: string, hour: string): AppointmentSlot | null {
    const date = this.selectedDate();
    return (
      this.appointments().find(
        (apt) =>
          apt.cubiculoId === cubiculoId &&
          apt.horaInicio === hour &&
          this.isSameDay(apt.fecha, date),
      ) || null
    );
  }

  // --- CAMBIO 3: Cálculo del span fijo a 30 min ---
  getAppointmentSpan(appointment: AppointmentSlot): number {
    const start = this.calendarService.timeToMinutes(appointment.horaInicio);
    const end = this.calendarService.timeToMinutes(appointment.horaFin);
    const duration = end - start;
    
    // Como las columnas SIEMPRE son de 30 minutos, dividimos entre 30.
    return Math.ceil(duration / 30);
  }

  onCellClick(cubiculoId: string, hour: string): void {
    if (this.isHourDisabled(hour)) {
      alert('⚠️ Esta hora no está disponible para agendar');
      return;
    }
    if (this.getAppointmentAt(cubiculoId, hour)) return;

    const currentUser = this.authService.currentUser();
    const pacienteIdDefault = currentUser?.rol === UserRole.ADMINISTRADOR ? '' : currentUser?.id || '';

    this.appointmentForm.set({
      cubiculoId,
      fecha: this.formatDateForInput(this.selectedDate()),
      horaInicio: hour,
      horaFin: this.getNextSlot(hour),
      pacienteId: pacienteIdDefault,
      pacienteNombre: '',
      terapeutaId: '',
      terapeutaNombre: '',
      materia: '',
      modalidad: 'Presencial',
      estado: 'Agendado',
      notas: '',
    });
    this.showAppointmentDialog.set(true);
  }

  // ============================================
  // UTILIDADES
  // ============================================

  formatDate(date: Date): string {
    return formatDisplayDate(date);
  }

  isCurrentHour(hour: string): boolean {
    return hour === this.currentTime();
  }

  private formatDateForInput(date: Date): string {
    return formatDateForInput(date);
  }

  private getNextSlot(hour: string): string {
    const hours = this.hours();
    const index = hours.indexOf(hour);
    // Retorna el siguiente slot o la misma hora si es el final
    return hours[index + 1] || hour;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

  private mapEstadoToAPI(estado: string): string {
    const estadoMap: Record<string, string> = {
      Agendado: 'Agendado',
      Completado: 'Completado',
      Cancelado: 'Cancelado',
      NoAsistio: 'NoAsistio',
    };
    return estadoMap[estado] || 'Agendado';
  }

  // Recursos de usuarios
  terapeutasResource = rxResource({
    stream: () => this.usersService.getActiveUsersByRole(UserRole.TERAPEUTA),
  });

  pacientesResource = rxResource({
    stream: () => {
      if (!this.isAdminUser()) {
        return of({ status: 'success', data: [], message: '', timestamp: '' });
      }
      return this.usersService.getActiveUsersByRole(UserRole.PACIENTE);
    },
  });

  onTerapeutaChange(id: string) {
    const lista = this.terapeutasResource.value()?.data || [];
    const seleccionado = lista.find((t) => t.usuarioId?.toString() === id);
    if (seleccionado?.nombreCompleto) {
      this.appointmentForm.update((f) => ({ ...f, terapeutaNombre: seleccionado.nombreCompleto ?? '' }));
    }
  }

  onPacienteChange(id: string) {
    const lista = this.pacientesResource.value()?.data || [];
    const seleccionado = lista.find((p) => p.usuarioId?.toString() === id);
    if (seleccionado?.nombreCompleto) {
      this.appointmentForm.update((f) => ({ ...f, pacienteNombre: seleccionado.nombreCompleto ?? '' }));
    }
  }

  // Estados
  isLoading = computed(() => this.citasResource.isLoading() || this.espaciosResource.isLoading() || this.configResource.isLoading());
  hasError = computed(() => this.citasResource.error() || this.espaciosResource.error() || this.configResource.error());

  reloadData(): void {
    this.citasTrigger.update((v) => v + 1);
    this.espaciosTrigger.update((v) => v + 1);
    this.configTrigger.update((v) => v + 1);
  }

  onEspacioSelected(id: number | null) {
    this.selectedEspacioId.set(id);
  }
}