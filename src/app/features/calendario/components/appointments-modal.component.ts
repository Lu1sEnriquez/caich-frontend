import { Component, signal, computed, inject, OnInit, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentSlot } from '../../../core/models/models';
import { formatDisplayDate, getTicketStatusBadgeClass, getTicketStatusLabel } from '../../../core/utils';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';

/**
 * Modal para mostrar lista de citas del mes actual
 * Permite ver detalles y navegar al detalle de cada cita
 */
@Component({
  selector: 'app-appointments-modal',
  standalone: true,
  imports: [CommonModule, ButtonComponent, BadgeComponent],
  templateUrl: './appointments-modal.component.html',
  styleUrls: ['./appointments-modal.component.css'],
})
export class AppointmentsModalComponent implements OnInit {
  // Inputs y Outputs
  appointments = input<AppointmentSlot[]>([]);
  isOpen = input(false);
  closed = output<void>();
  selectedAppointment = output<AppointmentSlot>();

  // Estado
  filterStatus = signal<'all' | 'agendado' | 'completado'>('all');
  searchText = signal('');

  // Computed: Citas filtradas
  filteredAppointments = computed(() => {
    let filtered = this.appointments();

    // Filtrar por estado
    if (this.filterStatus() !== 'all') {
      filtered = filtered.filter((apt) => {
        const statusMap: { [key: string]: string } = {
          agendado: 'Agendado',
          completado: 'Completado',
        };
        return apt.estado === statusMap[this.filterStatus()];
      });
    }

    // Filtrar por búsqueda (paciente o terapeuta)
    if (this.searchText()) {
      const search = this.searchText().toLowerCase();
      filtered = filtered.filter(
        (apt) =>
          apt.pacienteNombre?.toLowerCase().includes(search) ||
          apt.terapeutaNombre?.toLowerCase().includes(search)
      );
    }

    // Ordenar por fecha
    return filtered.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  });

  ngOnInit(): void {
    // Inicializar si es necesario
  }

  // Cerrar modal
  closeModal(): void {
    this.closed.emit();
  }

  // Seleccionar cita
  selectAppointment(appointment: AppointmentSlot): void {
    this.selectedAppointment.emit(appointment);
  }

  // Formatear fecha para display
  formatDate(date: Date): string {
    return formatDisplayDate(date);
  }

  // Obtener hora de display
  getHoraDisplay(appointment: AppointmentSlot): string {
    return `${appointment.horaInicio} - ${appointment.horaFin}`;
  }

  // Obtener clase de status para badge
  getStatusBadge(estado: string): 'success' | 'warning' | 'danger' | 'default' {
    const badgeClass = getTicketStatusBadgeClass(estado as any);
    const badgeMap: { [key: string]: 'success' | 'warning' | 'danger' | 'default' } = {
      'badge-success': 'success',
      'badge-warning': 'warning',
      'badge-danger': 'danger',
      'badge-secondary': 'default',
      'badge-info': 'default',
      'badge-default': 'default',
    };
    return badgeMap[badgeClass] || 'default';
  }

  // Obtener texto de status
  getStatusText(estado: string): string {
    return getTicketStatusLabel(estado as any);
  }
}
