import { Component, signal, computed, input, output, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarService } from '../../../core/services/calendar.service';
import { rxResource } from '@angular/core/rxjs-interop';

export interface Ticket {
  id?: string;
  citaId: string;
  tipoTicket: 'Cita' | 'Prestamo' | 'Venta';
  costoAdicional: number;
  montoPagado: number;
  productos: TicketProducto[];
  estado: 'Pendiente' | 'Pagado' | 'Cancelado';
  notas: string;
  fechaCreacion?: string;
}

export interface TicketProducto {
  productoId: string;
  nombre: string;
  cantidad: number;
  precio: number;
  tipoUso: 'Venta' | 'Prestamo';
  fechaDevolucionEstimada?: string;
  subtotal: number;
}

@Component({
  selector: 'app-ticket-manager-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ticket-manager-modal.component.html',
  styleUrl: './ticket-manager-modal.component.css'
})
export class TicketManagerModalComponent {
  isOpen = input(false);
  ticket = input<Ticket | null>(null);
  onClose = output<void>();
  onSave = output<Ticket>();

  private calendarService = inject(CalendarService);

  // Estado del formulario
  mode = computed(() => this.ticket() ? 'edit' : 'create');
  
  ticketForm = signal<Ticket>({
    citaId: '',
    tipoTicket: 'Cita',
    costoAdicional: 0,
    montoPagado: 0,
    productos: [],
    estado: 'Pendiente',
    notas: ''
  });

  // Inicializar formulario cuando se abre el modal o cambia el ticket
  constructor() {
    effect(() => {
      if (this.isOpen()) {
        if (this.ticket()) {
          this.ticketForm.set({ ...this.ticket()! });
        } else {
          this.ticketForm.set({
            citaId: '',
            tipoTicket: 'Cita',
            costoAdicional: 0,
            montoPagado: 0,
            productos: [],
            estado: 'Pendiente',
            notas: ''
          });
        }
      }
    });
  }

  // Computed para totales
  totalProductos = computed(() => {
    return this.ticketForm().productos.reduce((sum, p) => sum + p.subtotal, 0);
  });

  totalGeneral = computed(() => {
    const total = this.totalProductos() + this.ticketForm().costoAdicional;
    return total;
  });

  montoFaltante = computed(() => {
    const total = this.totalGeneral();
    const pagado = this.ticketForm().montoPagado || 0;
    return Math.max(0, total - pagado);
  });

  porcentajePago = computed(() => {
    const total = this.totalGeneral();
    const pagado = this.ticketForm().montoPagado || 0;
    if (total === 0) return 0;
    return Math.round((pagado / total) * 100);
  });

  // Actualizar subtotal cuando cambian cantidad o precio
  updateProductoSubtotal(producto: TicketProducto): void {
    producto.subtotal = (producto.cantidad || 0) * (producto.precio || 0);
  }

  // Remover producto
  removeProducto(index: number): void {
    this.ticketForm.update(form => ({
      ...form,
      productos: form.productos.filter((_, i) => i !== index)
    }));
  }

  // Guardar ticket
  save(): void {
    const form = this.ticketForm();
    if (!form.citaId) {
      alert('Debe especificar una cita');
      return;
    }

    if (form.montoPagado > this.totalGeneral()) {
      alert('El monto pagado no puede ser mayor que el total');
      return;
    }

    this.onSave.emit(form);
    this.close();
  }

  // Cerrar modal
  close(): void {
    this.onClose.emit();
  }

  // Formatear moneda
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  // Obtener clase de estado de pago
  getPaymentStatusClass(): string {
    const porcentaje = this.porcentajePago();
    if (porcentaje === 0) return 'status-unpaid';
    if (porcentaje === 100) return 'status-paid';
    return 'status-partial';
  }

  // Obtener texto de estado de pago
  getPaymentStatusText(): string {
    const porcentaje = this.porcentajePago();
    if (porcentaje === 0) return 'No pagado';
    if (porcentaje === 100) return 'Pagado';
    return `${porcentaje}% pagado`;
  }
}
