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
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { CardComponent } from '../../../shared/components/ui/card/card.component';
import { AppointmentSlot, Cubiculo, DayScheduleConfig } from '../../../core/models/models';
import {
  CalendarService,
  CrearCitaDTO,
  ActualizarCitaDTO,
} from '../../../core/services/calendar.service';
import { AuthService } from '../../../core/services/auth.service';
import { DateUtilService } from '../../../core/services/date-util.service';
import { UserRole } from '../../../core/models/enums';
import { formatDisplayDate, formatDateForInput } from '../../../core/utils';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

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

  // Inputs y Outputs
  selectedDate = input.required<Date>();
  appointmentSaved = output<AppointmentSlot>();

  // ✨ Exponer usuario actual para el template (role-based visibility)
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

  // ✨ Separar horas temporales de las guardadas
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

  // RXResource para espacios
  espaciosResource = rxResource({
    params: () => ({ trigger: this.espaciosTrigger() }),
    stream: ({ params }) => {
      if (params.trigger === 0) return of(null);
      return this.calendarService.getEspacios();
    },
  });

  // RXResource para citas del día
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

  // RXResource para configuración (ahora requiere espacioId)
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

  // Computed: Espacios mapeados
  cubiculos = computed(() => {
    const response = this.espaciosResource.value();
    if (!response?.data) return [];

    return response.data
      .map((dto) => this.calendarService.mapToCubiculo(dto))
      .filter((cubiculo) => cubiculo.disponible);
  });

  // Computed: Citas del día mapeadas
  appointments = computed(() => {
    const response = this.citasResource.value();
    if (!response?.data) return [];

    return response.data.map((dto) => this.calendarService.mapToAppointmentSlot(dto));
  });

  // Computed: Configuración del día
  scheduleConfig = computed(() => {
    const response = this.configResource.value();

    const defaultConfig: DayScheduleConfig = {
      fecha: this.selectedDate(),
      horaInicio: 7,
      horaFin: 18,
      intervalo: 60,
      horasDeshabilitadas: [],
      esHorarioDefault: true,
    };

    if (!response?.data) return defaultConfig;

    return {
      ...defaultConfig,
      horasDeshabilitadas: response.data.horasDeshabilitadas || [],
      esHorarioDefault: false,
    };
  });

  // Computed: Horas mostradas en el encabezado
  hours = computed(() => {
    const config = this.scheduleConfig();
    const hours: string[] = [];

    // Si es horario por defecto, mostrar todas las horas
    if (config.esHorarioDefault) {
      for (let h = config.horaInicio; h < config.horaFin; h++) {
        hours.push(`${h.toString().padStart(2, '0')}:00`);
      }
    } else {
      // Horario personalizado
      for (let h = config.horaInicio; h <= config.horaFin; h++) {
        hours.push(`${h.toString().padStart(2, '0')}:00`);
        if (h < config.horaFin) {
          hours.push(`${h.toString().padStart(2, '0')}:30`);
        }
      }
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
    // Auto-scroll al cambiar la fecha
    effect(() => {
      this.selectedDate();
      setTimeout(() => this.scrollToCurrentTime(), 100);
    });

    // Recargar datos cuando cambie la fecha seleccionada
    effect(() => {
      this.selectedDate();
      this.citasTrigger.update((v) => v + 1);
    });

    // Recargar configuración cuando cambie el espacio seleccionado
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

    const scrollPosition = 150 + hourIndex * 120 - 240;

    this.tableWrapper.nativeElement.scrollTo({
      left: Math.max(0, scrollPosition),
      behavior: 'smooth',
    });
  }

  // ============================================
  // MÉTODOS DE CONFIGURACIÓN DE HORARIOS
  // ============================================

  toggleConfigMode(espacioId?: number): void {
    if (!this.configMode()) {
      if (espacioId) {
        this.selectedEspacioId.set(espacioId);
      }
      // ✨ Al entrar en modo config, copiar las horas guardadas a temporales
      this.tempDisabledHours.set([...this.scheduleConfig().horasDeshabilitadas]);
    }
    this.configMode.update((v) => !v);
  }

  toggleHourAvailability(hour: string): void {
    const disabled = this.tempDisabledHours();

    if (disabled.includes(hour)) {
      // Remover de la lista
      this.tempDisabledHours.set(disabled.filter((h) => h !== hour));
    } else {
      // Agregar a la lista
      this.tempDisabledHours.set([...disabled, hour]);
    }
  }

  isHourDisabled(hour: string): boolean {
    // En modo configuración, usar horas temporales
    if (this.configMode()) {
      return this.tempDisabledHours().includes(hour);
    }
    // Fuera de modo config, usar las guardadas
    return this.scheduleConfig().horasDeshabilitadas.includes(hour);
  }

  saveConfig(): void {
    const espacioId = this.selectedEspacioId();
    if (!espacioId) {
      alert('❌ Debes seleccionar un espacio primero');
      return;
    }

    // ✨ Guardar las horas temporales en la configuración permanente
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
    // ✨ Restaurar las horas temporales a las guardadas
    this.tempDisabledHours.set([...this.scheduleConfig().horasDeshabilitadas]);
    this.configMode.set(false);
    this.selectedEspacioId.set(null);
  }

  // ============================================
  // MÉTODOS DE VALIDACIÓN
  // ============================================

  private validateTimeSlot(): boolean {
    const form = this.appointmentForm();
    const editing = this.editingAppointment();

    // 1. Validar campos requeridos
    if (
      !form.cubiculoId ||
      !form.horaInicio ||
      !form.horaFin ||
      !form.pacienteNombre ||
      !form.terapeutaNombre ||
      !form.materia
    ) {
      this.validationMessage.set('Por favor completa todos los campos requeridos');
      return false;
    }

    // 2. Validar que hora fin > hora inicio
    const formStartMinutes = this.calendarService.timeToMinutes(form.horaInicio);
    const formEndMinutes = this.calendarService.timeToMinutes(form.horaFin);

    if (formEndMinutes <= formStartMinutes) {
      this.validationMessage.set('La hora de fin debe ser posterior a la hora de inicio');
      return false;
    }

    // 3. ✨ VALIDACIÓN COMPLETA: Verificar conflictos de horario
    const conflict = this.appointments().find((apt) => {
      // Ignorar la cita actual si estamos editando
      if (editing && apt.id === editing.id) return false;

      // Solo verificar mismo cubículo
      if (apt.cubiculoId !== form.cubiculoId) return false;

      // Solo verificar misma fecha
      if (!this.isSameDay(apt.fecha, new Date(form.fecha))) return false;

      // Calcular rangos de tiempo en minutos
      const aptStart = this.calendarService.timeToMinutes(apt.horaInicio);
      const aptEnd = this.calendarService.timeToMinutes(apt.horaFin);

      const hasOverlap =
        (formStartMinutes < aptEnd && formEndMinutes > aptStart) ||
        (formStartMinutes <= aptStart && formEndMinutes >= aptEnd) ||
        (aptStart <= formStartMinutes && aptEnd >= formEndMinutes);

      return hasOverlap;
    });

    if (conflict) {
      this.validationMessage.set(
        `⚠️ Ya existe una cita para "${conflict.pacienteNombre}" de ${conflict.horaInicio} a ${conflict.horaFin}. ` +
          `No se pueden agendar citas que se solapen en el mismo cubículo.`
      );
      return false;
    }

    // ✅ Todo válido
    this.validationMessage.set('');
    return true;
  }

  // ============================================
  // MÉTODOS CRUD DE CITAS
  // ============================================

  /**
   * Centralizado saveAppointment: Maneja creación y edición de citas
   * - Para CREAR: Envía CrearCitaDTO al endpoint POST /citas
   *   Backend crea la cita + pago pendiente transaccionalmente
   * - Para EDITAR: Envía ActualizarCitaDTO al endpoint PUT /citas/{id}
   */
  saveAppointment(): void {
    if (!this.validateTimeSlot()) {
      console.log('❌ Validación fallida:', this.validationMessage());
      return;
    }

    const form = this.appointmentForm();
    const editing = this.editingAppointment();

    // Obtener IDs del usuario actual (auto-poblado desde AuthService)
    const currentUser = this.authService.currentUser();
    const isAdmin = currentUser?.rol === UserRole.ADMINISTRADOR;

    // Calcular duración en minutos
    const duracion = this.calendarService.calculateDuration(form.horaInicio, form.horaFin);

    // Crear fecha completa con hora de inicio
    const [y, m, d] = form.fecha.split('-').map(Number);
    const fechaCompleta = new Date(y, m - 1, d);
    const [hours, minutes] = form.horaInicio.split(':').map(Number);
    fechaCompleta.setHours(hours, minutes, 0, 0);

    // ================== RAMA: CREAR o ACTUALIZAR ==================
    if (editing) {
      // ✅ RAMA ACTUALIZAR: Cita existente
      this.performUpdateAppointment(editing, form, duracion, fechaCompleta);
    } else {
      // ✅ RAMA CREAR: Nueva cita
      // Backend maneja la creación de pago pendiente transaccionalmente
      this.performCreateAppointment(form, duracion, fechaCompleta, currentUser?.id, isAdmin);
    }
  }

  /**
   * Crear nueva cita: Backend creará automáticamente el pago pendiente
   * //TODO: Backend debe crear pago pendiente al crear cita (transactional)
   */
  private performCreateAppointment(
    form: any,
    duracion: number,
    fechaCompleta: Date,
    currentUserId: string | undefined,
    isAdmin: boolean
  ): void {
    // Usar pacienteId del formulario si es admin, sino del usuario autenticado
    const pacienteId = isAdmin
      ? Number(form.pacienteId)
      : currentUserId
      ? Number(currentUserId)
      : 1;

    // //TODO: Obtener terapeutaId del formulario o de búsqueda por nombre
    const terapeutaId = Number(form.terapeutaId) || 1;

    // //TODO: Obtener cuentaDestinoId de configuración por defecto
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
        console.log('✅ Nueva cita creada:', newAppointment);
        console.log('📝 Backend creó pago pendiente automáticamente');

        this.citasTrigger.update((v) => v + 1);
        this.appointmentSaved.emit(newAppointment);
        this.closeDialog();
        alert('✅ Cita agendada. Pago pendiente creado automáticamente.');
      },
      error: (error: unknown) => {
        // El HttpErrorInterceptor ya maneja el error y muestra mensajes
        console.error('❌ Error al crear cita:', error);
      },
    });
  }

  /**
   * Actualizar cita existente
   */
  private performUpdateAppointment(
    editing: AppointmentSlot,
    form: any,
    duracion: number,
    fechaCompleta: Date
  ): void {
    // //TODO: Obtener IDs reales desde el formulario o base de datos
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
        console.log('✅ Cita actualizada:', updatedAppointment);

        this.citasTrigger.update((v) => v + 1);
        this.appointmentSaved.emit(updatedAppointment);
        this.closeDialog();
        alert('✅ Cita actualizada correctamente.');
      },
      error: (error: unknown) => {
        // El HttpErrorInterceptor ya maneja el error y muestra mensajes
        console.error('❌ Error al actualizar cita:', error);
      },
    });
  }

  deleteAppointment(): void {
    const editing = this.editingAppointment();
    if (!editing) return;

    const confirmation = confirm(
      `¿Estás seguro de eliminar la cita?\n\n` +
        `Paciente: ${editing.pacienteNombre}\n` +
        `Fecha: ${this.formatDate(editing.fecha)}\n` +
        `Hora: ${editing.horaInicio} - ${editing.horaFin}`
    );

    if (confirmation) {
      this.calendarService.eliminarCita(Number(editing.id)).subscribe({
        next: () => {
          this.citasTrigger.update((v) => v + 1);
          this.closeDialog();
          console.log('🗑️ Cita eliminada:', editing);
        },
        error: (error) => {
          console.error('❌ Error al eliminar cita:', error);
          alert('Error al eliminar la cita');
        },
      });
    }
  }

  openNewAppointment(): void {
    this.editingAppointment.set(null);
    const currentUser = this.authService.currentUser();
    const pacienteIdDefault =
      currentUser?.rol === UserRole.ADMINISTRADOR ? '' : currentUser?.id || '';

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
      pacienteId: '',
      pacienteNombre: appointment.pacienteNombre,
      terapeutaId: '',
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
  // MÉTODOS DE TABLA
  // ============================================

  shouldSkipCell(cubiculoId: string, hour: string): boolean {
    const date = this.selectedDate();
    const currentMinutes = this.calendarService.timeToMinutes(hour);

    return this.appointments().some((apt) => {
      if (apt.cubiculoId !== cubiculoId) return false;
      if (!this.isSameDay(apt.fecha, date)) return false;

      const startMinutes = this.calendarService.timeToMinutes(apt.horaInicio);
      const endMinutes = this.calendarService.timeToMinutes(apt.horaFin);

      // La celda está dentro del rango pero NO es el inicio
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
          this.isSameDay(apt.fecha, date)
      ) || null
    );
  }

  getAppointmentSpan(appointment: AppointmentSlot): number {
    const start = this.calendarService.timeToMinutes(appointment.horaInicio);
    const end = this.calendarService.timeToMinutes(appointment.horaFin);
    const duration = end - start;
    return Math.ceil(duration / 30); // Cada columna = 30 min
  }

  onCellClick(cubiculoId: string, hour: string): void {
    // No permitir agendar en horas deshabilitadas
    if (this.isHourDisabled(hour)) {
      alert('⚠️ Esta hora no está disponible para agendar');
      return;
    }

    // No permitir agendar si ya hay una cita
    if (this.getAppointmentAt(cubiculoId, hour)) return;

    // Abrir diálogo con datos precargados
    const currentUser = this.authService.currentUser();
    const pacienteIdDefault =
      currentUser?.rol === UserRole.ADMINISTRADOR ? '' : currentUser?.id || '';

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
  // MÉTODOS AUXILIARES
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

  // ============================================
  // MÉTODOS PARA ESTADOS DE CARGA
  // ============================================

  isLoading = computed(() => {
    return (
      this.citasResource.isLoading() ||
      this.espaciosResource.isLoading() ||
      this.configResource.isLoading()
    );
  });

  hasError = computed(() => {
    return (
      this.citasResource.error() || this.espaciosResource.error() || this.configResource.error()
    );
  });

  reloadData(): void {
    this.citasTrigger.update((v) => v + 1);
    this.espaciosTrigger.update((v) => v + 1);
    this.configTrigger.update((v) => v + 1);
  }

  onEspacioSelected(id: number | null) {
    this.selectedEspacioId.set(id);
  }
}
