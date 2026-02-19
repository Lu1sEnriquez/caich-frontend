import { Component, signal, computed, input, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketService } from '../../../core/services/ticket.service';
import { TicketManagerModalComponent, Ticket } from '../ticket-manager-modal/ticket-manager-modal.component';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, TicketManagerModalComponent],
  templateUrl: './ticket-list.component.html',
  styleUrl: './ticket-list.component.css'
})
export class TicketListComponent {
  citaId = input<string>('');
  private ticketService = inject(TicketService);

  // Estado
  refresh = signal(0);
  showTicketModal = signal(false);
  editingTicket = signal<Ticket | null>(null);

  // Resource para cargar tickets
  ticketsResource = rxResource({
    params: () => ({
      citaId: this.citaId(),
      refresh: this.refresh()
    }),
    stream: ({ params }) => {
      if (!params.citaId) return of({ data: [] });
      return this.ticketService.getTicketsByCita(params.citaId);
    }
  });

  // Tickets disponibles
  tickets = computed(() => {
    const response = this.ticketsResource.value();
    
    if (!response) return [];
    
    // Si es array directo
    if (Array.isArray(response)) {
      return response;
    }
    
    // Si es objeto con propiedad data
    if (response.data) {
      return Array.isArray(response.data) ? response.data : [];
    }
    
    return [];
  });

  // Totales
  totalTickets = computed(() => this.tickets().length);
  
  totalVentas = computed(() => {
    return this.tickets()
      .filter((t: Ticket) => t.tipoTicket === 'Venta')
      .reduce((sum: number, t: Ticket) => sum + this.calcularTotal(t), 0);
  });

  totalPrestamos = computed(() => {
    return this.tickets()
      .filter((t: Ticket) => t.tipoTicket === 'Prestamo')
      .length;
  });

  totalCobrado = computed(() => {
    return this.tickets()
      .reduce((sum: number, t: Ticket) => sum + (t.montoPagado || 0), 0);
  });

  openNewTicket(): void {
    this.editingTicket.set(null);
    this.showTicketModal.set(true);
  }

  editTicket(ticket: Ticket): void {
    this.editingTicket.set(ticket);
    this.showTicketModal.set(true);
  }

  closeTicketModal(): void {
    this.showTicketModal.set(false);
    this.editingTicket.set(null);
  }

  onTicketSave(ticket: Ticket): void {
    if (this.editingTicket()) {
      // Actualizar
      this.ticketService.updateTicket(ticket.id || '', ticket).subscribe(() => {
        this.refresh.update(v => v + 1);
      });
    } else {
      // Crear
      this.ticketService.createTicket(ticket).subscribe(() => {
        this.refresh.update(v => v + 1);
      });
    }
  }

  deleteTicket(ticket: Ticket): void {
    if (confirm(`¿Eliminar ticket #${ticket.id}?`)) {
      this.ticketService.deleteTicket(ticket.id || '').subscribe(() => {
        this.refresh.update(v => v + 1);
      });
    }
  }

  calcularTotal(ticket: Ticket): number {
    let total = ticket.costoAdicional || 0;
    if (ticket.productos) {
      total += ticket.productos.reduce((sum, p) => sum + (p.subtotal || 0), 0);
    }
    return total;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'Pagado':
        return 'estado-pagado';
      case 'Pendiente':
        return 'estado-pendiente';
      case 'Cancelado':
        return 'estado-cancelado';
      default:
        return '';
    }
  }

  getTipoTicketIcon(tipo: string): string {
    switch (tipo) {
      case 'Cita':
        return '📅';
      case 'Venta':
        return '🛒';
      case 'Prestamo':
        return '📖';
      default:
        return '📋';
    }
  }
}
