import { Component, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { CalendarService } from '../../../core/services/calendar.service';
import { formatDateForInput } from '../../../core/utils';

@Component({
  selector: 'app-schedule-config-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  template: `
    <div class="schedule-config-modal">
      <!-- Tipo de Configuración -->
      <div class="config-section">
        <h3>Tipo de configuración</h3>
        <div class="config-options">
          <label class="config-option">
            <input
              type="radio"
              name="configType"
              value="block"
              [checked]="configType() === 'block'"
              (change)="configType.set('block'); onConfigTypeChange()"
            />
            <span>Bloquear día completo</span>
          </label>
          <label class="config-option">
            <input
              type="radio"
              name="configType"
              value="range"
              [checked]="configType() === 'range'"
              (change)="configType.set('range'); onConfigTypeChange()"
            />
            <span>Configurar rango de horarios</span>
          </label>
        </div>
      </div>

      <!-- Fecha -->
      <div class="config-section">
        <h3>Fecha</h3>
        <div class="date-selection">
          <div class="form-group">
            <label>Tipo de fecha</label>
            <select
              [ngModel]="dateType()"
              (ngModelChange)="dateType.set($event)"
              class="form-select"
            >
              <option value="single">Fecha específica</option>
              <option value="recurring">Día recurrente (ej: todos los lunes)</option>
            </select>
          </div>

          @if (dateType() === 'single') {
          <div class="form-group">
            <label>Fecha</label>
            <input
              type="date"
              [ngModel]="selectedDate()"
              (ngModelChange)="selectedDate.set($event)"
              class="form-input"
            />
          </div>
          } @if (dateType() === 'recurring') {
          <div class="form-group">
            <label>Día de la semana</label>
            <select
              [ngModel]="recurringDay()"
              (ngModelChange)="recurringDay.set($event)"
              class="form-select"
            >
              <option value="1">Lunes</option>
              <option value="2">Martes</option>
              <option value="3">Miércoles</option>
              <option value="4">Jueves</option>
              <option value="5">Viernes</option>
              <option value="6">Sábado</option>
              <option value="0">Domingo</option>
            </select>
          </div>
          }
        </div>
      </div>

      <!-- Configuración de Horarios (solo para tipo range) -->
      @if (configType() === 'range') {
      <div class="config-section">
        <h3>Horarios</h3>
        <div class="time-range">
          <div class="form-group">
            <label>Hora de inicio</label>
            <input
              type="time"
              [ngModel]="timeRange().start"
              (ngModelChange)="updateTimeRangeStart($event)"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>Hora de fin</label>
            <input
              type="time"
              [ngModel]="timeRange().end"
              (ngModelChange)="updateTimeRangeEnd($event)"
              class="form-input"
            />
          </div>
        </div>

        <!-- Horarios deshabilitados -->
        <div class="disabled-hours">
          <label>Horarios específicos deshabilitados</label>
          <div class="hours-grid">
            @for (hour of availableHours(); track hour) {
            <button
              class="hour-slot"
              [class.disabled]="isHourDisabled(hour)"
              (click)="toggleHour(hour)"
            >
              {{ hour }}
            </button>
            }
          </div>
        </div>
      </div>
      }

      <!-- Motivo -->
      <div class="config-section">
        <h3>Motivo</h3>
        <select [ngModel]="motivo()" (ngModelChange)="motivo.set($event)" class="form-select">
          <option value="">Seleccionar motivo</option>
          <option value="festivo">Día festivo</option>
          <option value="descanso">Día de descanso</option>
          <option value="mantenimiento">Mantenimiento</option>
          <option value="capacitacion">Capacitación</option>
          <option value="otro">Otro</option>
        </select>
        @if (motivo() === 'otro') {
        <input
          type="text"
          [ngModel]="motivoCustom()"
          (ngModelChange)="motivoCustom.set($event)"
          placeholder="Especificar motivo"
          class="form-input"
        />
        }
      </div>

      <!-- Espacios a aplicar -->
      <div class="config-section">
        <h3>Espacios</h3>
        <div class="spaces-selection">
          <label class="space-option">
            <input
              type="radio"
              name="spaceScope"
              value="all"
              [checked]="spaceScope() === 'all'"
              (change)="spaceScope.set('all'); onSpaceScopeChange()"
            />
            <span>Aplicar a todos los espacios</span>
          </label>
          <label class="space-option">
            <input
              type="radio"
              name="spaceScope"
              value="specific"
              [checked]="spaceScope() === 'specific'"
              (change)="spaceScope.set('specific'); onSpaceScopeChange()"
            />
            <span>Seleccionar espacios específicos</span>
          </label>

          @if (spaceScope() === 'specific') {
          <div class="spaces-list">
            @for (space of espacios(); track space.id) {
            <label class="space-checkbox">
              <input
                type="checkbox"
                [value]="space.id"
                [checked]="isSpaceSelected(space.id)"
                (change)="toggleSpace(space.id)"
              />
              <span>{{ space.nombre }} ({{ space.tipo }})</span>
            </label>
            }
          </div>
          }
        </div>
      </div>

      <!-- Acciones -->
      <div class="modal-actions">
        <app-button variant="outline" (click)="cancel.emit()">Cancelar</app-button>
        <app-button variant="primary" (click)="saveConfig()">Guardar Configuración</app-button>
      </div>
    </div>
  `,
  styleUrls: ['./schedule-config-modal.component.css'],
})
export class ScheduleConfigModalComponent {
  private calendarService = inject(CalendarService);

  // Outputs
  save = output<any>();
  cancel = output();

  // Estado del formulario
  configType = signal<'block' | 'range'>('block');
  dateType = signal<'single' | 'recurring'>('single');
  selectedDate = signal(formatDateForInput(new Date()));
  recurringDay = signal('1');
  timeRange = signal({ start: '09:00', end: '17:00' });
  motivo = signal('');
  motivoCustom = signal('');
  spaceScope = signal<'all' | 'specific'>('all');
  selectedSpaces = signal<number[]>([]);
  disabledHours = signal<string[]>([]);

  // Datos
  espacios = signal<any[]>([]);

  // Computed
  availableHours = computed(() => {
    const hours: string[] = [];
    for (let h = 7; h <= 21; h++) {
      for (let m = 0; m < 60; m += 30) {
        const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        hours.push(time);
      }
    }
    return hours;
  });

  constructor() {
    this.loadEspacios();
  }

  // Métodos para actualizar timeRange
  updateTimeRangeStart(newStart: string) {
    const current = this.timeRange();
    this.timeRange.set({ ...current, start: newStart });
  }

  updateTimeRangeEnd(newEnd: string) {
    const current = this.timeRange();
    this.timeRange.set({ ...current, end: newEnd });
  }

  loadEspacios() {
    this.calendarService.getEspacios().subscribe({
      next: (response) => {
        this.espacios.set(response.data.map((dto: any) => this.calendarService.mapToCubiculo(dto)));
      },
      error: (error) => {
        console.error('Error al cargar espacios:', error);
      },
    });
  }

  onConfigTypeChange() {
    if (this.configType() === 'block') {
      this.disabledHours.set([]);
    }
  }

  onSpaceScopeChange() {
    if (this.spaceScope() === 'all') {
      this.selectedSpaces.set([]);
    }
  }

  toggleHour(hour: string) {
    const disabled = this.disabledHours();
    if (disabled.includes(hour)) {
      this.disabledHours.set(disabled.filter((h) => h !== hour));
    } else {
      this.disabledHours.set([...disabled, hour]);
    }
  }

  isHourDisabled(hour: string): boolean {
    return this.disabledHours().includes(hour);
  }

  toggleSpace(spaceId: number) {
    const selected = this.selectedSpaces();
    if (selected.includes(spaceId)) {
      this.selectedSpaces.set(selected.filter((id) => id !== spaceId));
    } else {
      this.selectedSpaces.set([...selected, spaceId]);
    }
  }

  isSpaceSelected(spaceId: number): boolean {
    return this.selectedSpaces().includes(spaceId);
  }

  saveConfig() {
    const config = {
      tipo: this.configType(),
      fechaTipo: this.dateType(),
      fecha: this.dateType() === 'single' ? this.selectedDate() : null,
      diaRecurrente: this.dateType() === 'recurring' ? this.recurringDay() : null,
      horarioInicio: this.configType() === 'range' ? this.timeRange().start : null,
      horarioFin: this.configType() === 'range' ? this.timeRange().end : null,
      horasDeshabilitadas: this.configType() === 'range' ? this.disabledHours() : [],
      motivo: this.motivo() === 'otro' ? this.motivoCustom() : this.motivo(),
      aplicarATodos: this.spaceScope() === 'all',
      espaciosEspecificos: this.spaceScope() === 'specific' ? this.selectedSpaces() : [],
    };

    // Validaciones básicas
    if (!config.motivo) {
      alert('Por favor selecciona un motivo');
      return;
    }

    if (this.dateType() === 'single' && !config.fecha) {
      alert('Por favor selecciona una fecha');
      return;
    }

    this.save.emit(config);
  }

  private formatDateForInput(date: Date): string {
    return formatDateForInput(date);
  }
}
