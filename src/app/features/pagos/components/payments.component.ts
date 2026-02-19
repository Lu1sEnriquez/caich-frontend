import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../shared/components/ui/card/card.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';

import { PaymentsService } from '../../../core/services/payments.service';
import { TicketsService } from '../../../core/services/tickets.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/enums';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { BankAccount, FilterOptions, Payment } from '../../../core/models/models';
import { formatDisplayDate, formatMonto } from '../../../core/utils';
import { PagoRequestDTO } from '../../../core/models/api-models';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, ButtonComponent, BadgeComponent],
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.css'],
})
export class PaymentsComponent {
  private ticketsService = inject(TicketsService);
  private paymentsService = inject(PaymentsService);
  private authService = inject(AuthService);

  // Estado
  searchQuery = signal('');
  showFilterDialog = signal(false);
  showExportDialog = signal(false);
  showDetailsDialog = signal(false);
  showStatusDialog = signal(false);
  showNewPaymentDialog = signal(false);
  uploadedFile = signal<File | null>(null);
  selectedPayment = signal<Payment | null>(null);
  newStatus = signal('PENDIENTE_REVISION');
  statusNotes = signal('');
  statusComprobante = signal<File | null>(null);
  statusConcepto = signal('');
  bankAccounts = signal<BankAccount[]>([]);
  isDragging = signal(false);

  // Triggers
  paymentsTrigger = signal(1);
  updateStatusTrigger = signal(0);
  createPaymentTrigger = signal(0);
  bankAccountsTrigger = signal(1);

  // Verificar si es admin o paciente
  isAdmin = computed(() => this.authService.currentRole() === UserRole.ADMINISTRADOR);
  isPaciente = computed(() => this.authService.currentRole() === UserRole.PACIENTE);

  // Formulario de registro de pago
  uploadForm = signal({
    ticketId: 0,
    monto: 0,
    metodoPago: '',
    fechaPago: '',
    notas: '',
  });

  // Opciones de filtros
  filterOptions = signal<FilterOptions>({
    estado: '',
    montoMin: 0,
    montoMax: 0,
    paciente: '',
    fechaInicio: '',
    fechaFin: '',
  });

  // Filtros para exportación
  exportFilters = signal({
    estado: '',
    fechaInicio: '',
    fechaFin: '',
    paciente: '',
  });

  // ============================================
  // RXRESOURCE: OBTENER PAGOS (CON FILTROS DE FECHA)
  // ============================================
  paymentsResource = rxResource({
    params: () => ({
      trigger: this.paymentsTrigger(),
      filters: this.filterOptions(),
    }),
    stream: ({ params }) => {
      if (params.trigger === 0) return of(null);

      const filters: any = {};

      if (this.isPaciente()) {
        return of({
          status: 'success',
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
      }

      if (params.filters.estado) {
        filters.estado = params.filters.estado as any;
      }

      if (params.filters.fechaInicio) {
        filters.fechaInicio = params.filters.fechaInicio;
      }

      if (params.filters.fechaFin) {
        filters.fechaFin = params.filters.fechaFin;
      }

      return this.paymentsService.getPayments(filters);
    },
  });

  // Lista de pagos mapeada
  payments = computed(() => {
    const response = this.paymentsResource.value();
    if (!response) return [];

    const responseData = response as any;
    return (responseData.data.content || []).map((dto: any) => ({
      id: String(dto.pagoId),
      folio: dto.ticketFolio,
      nombre: dto.ticketFolio,
      status: dto.estado,
      pagoId: dto.pagoId,
      ticketId: dto.ticketId,
      ticketFolio: dto.ticketFolio,
      monto: dto.monto || 0,
      metodoPago: dto.metodoPago,
      comprobanteUrl: dto.comprobanteUrl,
      referencia: dto.referencia,
      estado: dto.estado,
      motivoRechazo: dto.motivoRechazo,
      verificadoPorNombre: dto.verificadoPorNombre,
      fechaPago: dto.fechaPago ? new Date(dto.fechaPago) : undefined,
      fechaCreacion: dto.fechaCreacion ? new Date(dto.fechaCreacion) : undefined,
    }));
  });

  // Resumen de pagos
  summary = computed(() => {
    const allPayments = this.payments();
    return {
      pendientes: allPayments.filter((p: any) => p.estado === 'PENDIENTE_REVISION').length,
      aprobados: allPayments.filter((p: any) => p.estado === 'APROBADO').length,
      rechazados: allPayments.filter((p: any) => p.estado === 'RECHAZADO').length,
      totalPendiente: allPayments
        .filter((p: any) => p.estado === 'PENDIENTE_REVISION')
        .reduce((sum: any, p: any) => sum + p.monto, 0),
    };
  });

  // Pagos filtrados por busqueda
  filteredPayments = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const allPayments = this.payments();

    if (!query) return allPayments;

    return allPayments.filter((payment: any) => {
      return (
        payment.nombre?.toLowerCase().includes(query) ||
        // payment.email?.toLowerCase().includes(query) || //TODO: checar esta propiedad
        payment.folio?.toLowerCase().includes(query)
      );
    });
  });

  // Crear pago
  createPaymentResource = rxResource({
    params: () => ({ trigger: this.createPaymentTrigger() }),
    stream: ({ params }) => {
      if (params.trigger === 0) return of(null);

      const form = this.uploadForm();

      const data: PagoRequestDTO = {
        ticketId: form.ticketId,
        monto: form.monto,
        metodoPago: form.metodoPago,
        referencia: form.notas || undefined,
      };

      return this.paymentsService.registerPayment(data);
    },
  });

  // Actualizar estado
  updateStatusResource = rxResource({
    params: () => ({ trigger: this.updateStatusTrigger() }),
    stream: ({ params }) => {
      if (params.trigger === 0) return of(null);

      const payment = this.selectedPayment();
      if (!payment) return of(null);

      const estadoPago = this.newStatus();

      if (estadoPago === 'APROBADO') {
        return this.paymentsService.approvePayment(payment.pagoId);
      }

      return this.paymentsService.rejectPayment(payment.pagoId, this.statusNotes() || '');
    },
  });

  // ============================================
  // METODO: ENVIAR PAGO (CON VALIDACION Y SUBIDA DE COMPROBANTE)
  // ============================================
  submitPayment(): void {
    if (!this.canSubmit()) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    console.log('💰 Registrando pago...');

    this.createPaymentTrigger.update((v) => v + 1);

    const checkResult = () => {
      if (this.createPaymentResource.value()) {
        console.log('Pago registrado exitosamente');

        const response = this.createPaymentResource.value()!;
        alert('Pago registrado exitosamente');
        this.resetForm();
        this.paymentsTrigger.update((v) => v + 1);
      } else if (!this.createPaymentResource.isLoading() && !this.createPaymentResource.error()) {
        setTimeout(checkResult, 100);
      } else if (this.createPaymentResource.error()) {
        console.error('Error:', this.createPaymentResource.error());
        const errorMsg =
          (this.createPaymentResource.error() as any)?.message || 'Error al registrar pago';
        alert(`${errorMsg}`);
      }
    };

    checkResult();
  }

  // ============================================
  // METODO: MANEJO DE ARCHIVO
  // ============================================
  handleFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.processFile(file);
    }
  }

  removeFile(): void {
    this.uploadedFile.set(null);
    this.onFormChange(); // Forzar actualización
  }

  // ============================================
  // METODO: APLICAR FILTROS
  // ============================================
  applyFilters(): void {
    console.log('Aplicando filtros:', this.filterOptions());
    this.paymentsTrigger.update((v) => v + 1);
  }

  clearFilters(): void {
    this.filterOptions.set({
      estado: '',
      montoMin: 0,
      montoMax: 0,
      paciente: '',
      fechaInicio: '',
      fechaFin: '',
    });
    this.searchQuery.set('');
    this.paymentsTrigger.update((v) => v + 1);
  }

  // ============================================
  // METODO: EXPORTAR A EXCEL (CON VALIDACION COMPLETA)
  // ============================================
  exportToExcel(): void {
    if (!this.canExport()) {
      alert('Selecciona un rango de fechas para exportar');
      return;
    }

    const filters = this.exportFilters();
    let dataToExport = this.payments();

    // Aplicar filtros
    if (filters.estado) {
      dataToExport = dataToExport.filter((p: any) => p.status === filters.estado);
    }

    if (filters.fechaInicio) {
      const startDate = new Date(filters.fechaInicio);
      dataToExport = dataToExport.filter((p: any) => p.fechaPago >= startDate);
    }

    if (filters.fechaFin) {
      const endDate = new Date(filters.fechaFin);
      dataToExport = dataToExport.filter((p: any) => p.fechaPago <= endDate);
    }

    if (filters.paciente) {
      dataToExport = dataToExport.filter((p: any) =>
        p.nombre?.toLowerCase().includes(filters.paciente.toLowerCase())
      );
    }

    // Validar que haya datos
    if (dataToExport.length === 0) {
      alert('No hay datos para exportar con los filtros seleccionados');
      return;
    }

    // Crear CSV
    const headers = [
      'Nombre',
      'Folio',
      'Banco',
      'Concepto',
      'Fecha de Pago',
      'Monto',
      'Estado',
      'Fecha de Registro',
    ];

    const rows = dataToExport.map((p: any) => [
      p.nombre,
      p.folio,
      p.banco,
      p.concepto,
      this.formatDate(p.fechaPago),
      p.monto.toFixed(2),
      p.status,
      this.formatDate(p.fechaRegistro),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(',')),
    ].join('\n');

    // Descargar archivo
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `pagos_${filters.fechaInicio}_${filters.fechaFin}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.closeExportDialog();
    alert(`Se exportaron ${dataToExport.length} registros`);
  }

  bankAccountsResource = rxResource({
    params: () => ({ trigger: this.bankAccountsTrigger() }),
    stream: ({ params }) => {
      if (params.trigger === 0) return of(null);
      return this.paymentsService.getBankAccounts();
    },
  });

  // Computed para mapear las cuentas
  bankAccountsList = computed(() => {
    const response = this.bankAccountsResource.value();
    if (!response) return [];

    return response.data.map((account) => ({
      id: String(account.cuentaId),
      banco: account.banco,
      numeroCuenta: account.numeroCuenta,
      clabe: account.clabe || '',
      titular: account.titular,
      activo: account.estaActiva,
    }));
  });

  // Método para copiar información de cuenta
  copyAccountInfo(account: BankAccount): void {
    const accountInfo = `Banco: ${account.banco}\nCuenta: ${account.numeroCuenta}\nCLABE: ${account.clabe}\nTitular: ${account.titular}`;

    navigator.clipboard
      .writeText(accountInfo)
      .then(() => {
        console.log('Informacion bancaria copiada');
        // Puedes mostrar un toast o alerta de éxito
        alert('Informacion bancaria copiada al portapapeles');
      })
      .catch((err) => {
        console.error('Error al copiar:', err);
        alert('Error al copiar la informacion');
      });
  }

  openNewPaymentDialog(): void {
    this.showNewPaymentDialog.set(true);
  }

  closeNewPaymentDialog(): void {
    this.showNewPaymentDialog.set(false);
    this.resetForm();
  }

  viewComprobante(): void {
    const payment = this.selectedPayment();
    if (!payment?.comprobanteUrl) {
      alert('No hay comprobante disponible');
      return;
    }

    window.open(payment.comprobanteUrl, '_blank');
  }

  // ============================================
  // MÉTODOS AUXILIARES
  // ============================================
  private processFile(file: File): void {
    // Validar tipo de archivo
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Solo se permiten archivos PDF, JPG o PNG');
      return;
    }

    // Validar tamano (5MB maximo)
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo no debe superar los 5MB');
      return;
    }

    this.uploadedFile.set(file);
    console.log('📎 Archivo cargado:', file.name);
  }

  // Método para manejar drag over
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  // Método para manejar drag leave
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  // Método para manejar drop de archivos
  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  canSubmit = computed(() => {
    const form = this.uploadForm();
    const hasFile = this.uploadedFile() !== null;

    console.log('Validando formulario:', {
      ticketId: form.ticketId,
      monto: form.monto,
      metodoPago: form.metodoPago,
      fechaPago: form.fechaPago,
      hasFile: hasFile,
    });

    return (
      form.ticketId > 0 &&
      form.monto > 0 &&
      form.metodoPago &&
      form.metodoPago.trim() !== '' &&
      form.fechaPago &&
      form.fechaPago.trim() !== '' &&
      hasFile
    );
  });

  onFormChange(): void {
    // Forzar actualización de la computed property
    this.uploadForm.set({ ...this.uploadForm() });
  }

  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  canExport = computed(() => {
    const filters = this.exportFilters();
    return filters.fechaInicio && filters.fechaFin;
  });

  getExportCount(): number {
    const filters = this.exportFilters();
    let result = this.payments();

    if (filters.estado) {
      result = result.filter((p: any) => p.status === filters.estado);
    }

    if (filters.fechaInicio) {
      const startDate = new Date(filters.fechaInicio);
      result = result.filter((p: any) => p.fechaPago >= startDate);
    }

    if (filters.fechaFin) {
      const endDate = new Date(filters.fechaFin);
      result = result.filter((p: any) => p.fechaPago <= endDate);
    }

    if (filters.paciente) {
      result = result.filter((p: any) =>
        p.nombre?.toLowerCase().includes(filters.paciente.toLowerCase())
      );
    }

    return result.length;
  }

  formatDate(date?: Date): string {
    if (!date) {
      return '-';
    }

    return formatDisplayDate(date);
  }

  resetForm(): void {
    this.uploadForm.set({
      ticketId: 0,
      monto: 0,
      metodoPago: '',
      fechaPago: '',
      notas: '',
    });
    this.uploadedFile.set(null);
  }

  // Gestión de diálogos
  openExportDialog(): void {
    this.showExportDialog.set(true);
  }

  closeExportDialog(): void {
    this.showExportDialog.set(false);
  }

  toggleFilterDialog(): void {
    this.showFilterDialog.update((v) => !v);
  }

  viewPaymentDetails(payment: Payment): void {
    this.selectedPayment.set(payment);
    this.showDetailsDialog.set(true);
  }

  closeDetailsDialog(): void {
    this.showDetailsDialog.set(false);
    this.selectedPayment.set(null);
  }

  openStatusDialog(payment: Payment): void {
    if (!this.isAdmin()) {
      alert('Solo los administradores pueden cambiar el estado de los pagos');
      return;
    }

    this.selectedPayment.set(payment);
    this.newStatus.set(payment.status || 'PENDIENTE_REVISION');
    this.statusNotes.set('');
    this.showStatusDialog.set(true);
  }

  closeStatusDialog(): void {
    this.showStatusDialog.set(false);
    this.selectedPayment.set(null);
    this.newStatus.set('PENDIENTE_REVISION');
    this.statusNotes.set('');
    this.statusComprobante.set(null);
    this.statusConcepto.set('');
  }

  updatePaymentStatus(): void {
    if (!this.isAdmin()) {
      alert('Solo los administradores pueden cambiar el estado de los pagos');
      return;
    }

    const payment = this.selectedPayment();
    if (!payment) return;

    console.log('Actualizando estado del pago...');
    this.updateStatusTrigger.update((v) => v + 1);

    const checkResult = () => {
      if (this.updateStatusResource.value()) {
        console.log('Estado actualizado exitosamente');
        alert('Estado actualizado exitosamente');
        this.closeStatusDialog();
        this.paymentsTrigger.update((v) => v + 1);
      } else if (!this.updateStatusResource.isLoading() && !this.updateStatusResource.error()) {
        setTimeout(checkResult, 100);
      } else if (this.updateStatusResource.error()) {
        console.error('Error:', this.updateStatusResource.error());
        alert('Error al actualizar estado');
      }
    };

    checkResult();
  }

  /**
   * Maneja la carga de archivo de comprobante
   */
  onComprobanteSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      // Validar que sea un archivo permitido (PDF, imagen)
      if (['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
        this.statusComprobante.set(file);
        console.log('Comprobante seleccionado:', file.name);
      } else {
        alert('Solo se permiten archivos PDF o imagenes (JPEG, PNG)');
      }
    }
  }

  /**
   * Limpia el comprobante seleccionado
   */
  clearComprobante(): void {
    this.statusComprobante.set(null);
  }
}
