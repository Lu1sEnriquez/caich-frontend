import { Component, signal, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../../../shared/components/ui/badge/badge.component';
import { formatDisplayDate, getPaymentStatusBadgeClass, formatMonto } from '../../../../core/utils';

/**
 * Interfaz para el objeto de pago
 * (Adaptarse según la estructura real de la API)
 */
export interface PaymentInfo {
  id: string;
  folio: string;
  monto: number;
  estado: 'Pagado' | 'Pendiente' | 'Cancelado';
  fechaVencimiento: Date;
  concepto: string;
  pacienteNombre?: string;
  terapeutaNombre?: string;
  citaId?: string;
}

/**
 * Modal para mostrar lista de pagos pendientes del mes actual
 * Permite ver detalles y navegar a la sección de pagos
 */
@Component({
  selector: 'app-payments-modal',
  standalone: true,
  imports: [CommonModule, ButtonComponent, BadgeComponent],
  templateUrl: './payments-modal.component.html',
  styleUrls: ['./payments-modal.component.css'],
})
export class PaymentsModalComponent {
  // Inputs y Outputs
  payments = input<PaymentInfo[]>([]);
  isOpen = input(false);
  closed = output<void>();
  navigateToPayments = output<void>();

  // Estado
  filterStatus = signal<'all' | 'pendiente' | 'pagado'>('all');
  searchText = signal('');

  // Computed: Pagos filtrados
  filteredPayments = computed(() => {
    let filtered = this.payments();

    // Filtrar por estado
    if (this.filterStatus() !== 'all') {
      filtered = filtered.filter((pago) => {
        const statusMap: { [key: string]: string } = {
          pendiente: 'Pendiente',
          pagado: 'Pagado',
        };
        return pago.estado === statusMap[this.filterStatus()];
      });
    }

    // Filtrar por búsqueda
    if (this.searchText()) {
      const search = this.searchText().toLowerCase();
      filtered = filtered.filter(
        (pago) =>
          pago.concepto?.toLowerCase().includes(search) ||
          pago.folio?.toLowerCase().includes(search) ||
          pago.pacienteNombre?.toLowerCase().includes(search)
      );
    }

    // Ordenar por fecha de vencimiento
    return filtered.sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime());
  });

  // Computed: Total de pagos pendientes
  totalPendiente = computed(() => {
    return this.filteredPayments()
      .filter((p) => p.estado === 'Pendiente')
      .reduce((total, p) => total + p.monto, 0);
  });

  // Cerrar modal
  closeModal(): void {
    this.closed.emit();
  }

  // Navegar a pagos
  irAPagos(): void {
    this.navigateToPayments.emit();
    this.closeModal();
  }

  // Formatear fecha para display
  formatDate(date: Date): string {
    return formatDisplayDate(date);
  }

  // Obtener clase de status para badge
  getStatusBadge(estado: string): 'success' | 'warning' | 'danger' | 'default' {
    const badgeClass = getPaymentStatusBadgeClass(estado as any);
    const badgeMap: { [key: string]: 'success' | 'warning' | 'danger' | 'default' } = {
      'badge-success': 'success',
      'badge-warning': 'warning',
      'badge-danger': 'danger',
      'badge-info': 'default',
      'badge-secondary': 'default',
      'badge-default': 'default',
    };
    return badgeMap[badgeClass] || 'default';
  }

  // Obtener texto de status
  getStatusText(estado: string): string {
    const statusMap: { [key: string]: string } = {
      Pagado: 'Pagado',
      Pendiente: 'Pendiente',
      Cancelado: 'Cancelado',
    };
    return statusMap[estado] || estado;
  }

  // Formatear monto
  formatMonto(monto: number): string {
    return formatMonto(monto);
  }

  // Obtener días hasta vencimiento
  diasHastaVencimiento(fecha: Date): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vencimiento = new Date(fecha);
    vencimiento.setHours(0, 0, 0, 0);
    const diferencia = vencimiento.getTime() - hoy.getTime();
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  }

  // Obtener clase de urgencia
  getUrgencyClass(dias: number): string {
    if (dias < 0) return 'urgente';
    if (dias <= 3) return 'proximo';
    return 'normal';
  }
}
