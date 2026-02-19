import { Component, ViewChild, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TicketsService } from '../../../core/services/tickets.service';
import { UsersService } from '../../../core/services/users.service';
import { SpacesService } from '../../../core/services/spaces.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { TicketDTO, TicketDetalleDTO } from '../../../core/models/api-models';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-ticket-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    ToastModule,
    TableModule
  ],
  template: `
    <p-toast></p-toast>

    <p-dialog 
      [(visible)]="displayModal" 
      [header]="isEditing ? 'Editar Ticket' : 'Crear Nuevo Ticket'"
      [modal]="true" 
      [style]="{ width: '90%', maxWidth: '900px' }"
      (onHide)="onModalClose()">

      <form [formGroup]="ticketForm">
        <div class="form-grid">
          <div class="form-group">
            <label>Tipo de Ticket:</label>
            <select formControlName="tipoTicket" class="form-control">
              <option value="Cita">Cita</option>
              <option value="Prestamo">Préstamo</option>
              <option value="Venta">Venta</option>
            </select>
          </div>

          <div class="form-group">
            <label>Paciente:</label>
            <select formControlName="pacienteId" class="form-control">
              <option value="">-- Seleccionar --</option>
              <option *ngFor="let p of pacientes" [value]="p.usuarioId">{{ p.nombreCompleto }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>Terapeuta:</label>
            <select formControlName="terapeutaId" class="form-control">
              <option value="">-- Seleccionar --</option>
              <option *ngFor="let t of terapeutas" [value]="t.usuarioId">{{ t.nombreCompleto }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>Espacio:</label>
            <select formControlName="espacioId" class="form-control">
              <option value="">-- Seleccionar --</option>
              <option *ngFor="let e of espacios" [value]="e.espacioId">{{ e.nombre }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>Fecha:</label>
            <input type="datetime-local" formControlName="fecha" class="form-control">
          </div>

          <div class="form-group">
            <label>Duración (minutos):</label>
            <input type="number" formControlName="duracion" min="15" class="form-control">
          </div>

          <div class="form-group">
            <label>Materia/Motivo:</label>
            <input type="text" formControlName="materia" class="form-control" placeholder="Ej: Psicología General">
          </div>

          <div class="form-group">
            <label>Modalidad:</label>
            <select formControlName="modalidad" class="form-control">
              <option value="Presencial">Presencial</option>
              <option value="Online">Online</option>
            </select>
          </div>

          <div class="form-group">
            <label>Costo Adicional:</label>
            <input type="number" formControlName="costoAdicional" min="0" step="0.01" class="form-control">
          </div>

          <div class="form-group">
            <label>Monto Pagado:</label>
            <input type="number" formControlName="montoPagado" min="0" step="0.01" class="form-control">
          </div>

          <div class="form-group full-width">
            <label>Notas:</label>
            <textarea formControlName="notas" rows="4" class="form-control" placeholder="Escriba notas adicionales..."></textarea>
          </div>
        </div>

        <div class="products-section" *ngIf="isEditing">
          <h4>Productos</h4>
          <button type="button" (click)="addProductRow()" class="btn btn-success mb-3">+ Agregar Producto</button>
          
          <table class="table table-sm" *ngIf="productosRows.length > 0">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Tipo Uso</th>
                <th>Fecha Dev.</th>
                <th>Subtotal</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of productosRows; let i = index">
                <td>
                  <select [(ngModel)]="row.productoId" (change)="onProductoChange(row)" class="form-control form-control-sm">
                    <option value="">-- Seleccionar --</option>
                    <option *ngFor="let p of productos" [value]="p.productoId">{{ p.nombre }}</option>
                  </select>
                </td>
                <td>
                  <input type="number" [(ngModel)]="row.cantidad" min="1" (input)="calculateRowSubtotal(row)" class="form-control form-control-sm">
                </td>
                <td>
                  <select [(ngModel)]="row.tipoUso" class="form-control form-control-sm">
                    <option value="Venta">Venta</option>
                    <option value="Prestamo">Préstamo</option>
                    <option value="Uso">Uso</option>
                  </select>
                </td>
                <td>
                  <input type="datetime-local" *ngIf="row.tipoUso === 'Prestamo'" [(ngModel)]="row.fechaDevolucionEstimada" class="form-control form-control-sm">
                </td>
                <td>{{ row.subtotal | currency }}</td>
                <td>
                  <button type="button" (click)="removeProductRow(i)" class="btn btn-danger btn-sm">Eliminar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </form>

      <ng-template pTemplate="footer">
        <button pButton 
          type="button" 
          label="Cancelar" 
          icon="pi pi-times"
          class="p-button-text"
          (click)="onCancel()">
        </button>
        <button pButton 
          type="button" 
          [label]="isEditing ? 'Actualizar' : 'Crear'" 
          icon="pi pi-check"
          class="p-button-success"
          [loading]="saving"
          (click)="saveTicket()"
          [disabled]="ticketForm.invalid">
        </button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    :host {
      display: block;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-md, 16px);
      margin-bottom: var(--space-lg, 24px);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-group label {
      font-size: 12px;
      font-weight: 700;
      color: var(--color-muted-foreground, #666);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .form-control {
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      width: 100%;
      height: 38px;
      padding: 0 12px;
      padding-right: 32px;
      font-size: 14px;
      color: var(--color-foreground, #333);
      background-color: var(--color-background, #ffffff);
      border: 1px solid var(--color-border, #e0e0e0);
      border-radius: var(--radius-sm, 4px);
      cursor: pointer;
      transition: all 0.2s ease;
      outline: none;
    }

    .form-control:hover {
      border-color: var(--color-primary, #0066cc);
    }

    .form-control:focus {
      border-color: var(--color-primary, #0066cc);
      box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
    }

    textarea.form-control {
      appearance: auto;
      -webkit-appearance: auto;
      height: auto;
      padding: 10px 12px;
      resize: vertical;
      min-height: 100px;
    }

    input[type="datetime-local"].form-control,
    input[type="number"].form-control,
    input[type="text"].form-control {
      appearance: auto;
      -webkit-appearance: auto;
      padding-right: 12px;
    }

    .products-section {
      padding: var(--space-lg, 24px) 0;
      border-top: 1px solid var(--color-border, #e0e0e0);
      margin-top: var(--space-lg, 24px);
    }

    .products-section h4 {
      margin: 0 0 var(--space-md, 16px);
      font-size: 16px;
      font-weight: 700;
      color: var(--color-foreground, #333);
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    .table thead {
      background-color: var(--color-muted, #f9f9f9);
    }

    .table th {
      padding: var(--space-md, 16px);
      text-align: left;
      font-size: 12px;
      font-weight: 700;
      color: var(--color-muted-foreground, #666);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid var(--color-border, #e0e0e0);
      background-color: var(--color-muted, #f9f9f9);
      white-space: nowrap;
    }

    .table td {
      padding: var(--space-md, 16px);
      font-size: 14px;
      color: var(--color-foreground, #333);
      border-bottom: 1px solid var(--color-border, #e0e0e0);
      vertical-align: middle;
    }

    .table tbody tr {
      transition: background-color 0.2s ease;
    }

    .table tbody tr:hover {
      background-color: var(--color-muted, #f9f9f9);
    }

    .table tbody tr:last-child td {
      border-bottom: 1px solid var(--color-border, #e0e0e0);
    }

    .form-control.form-control-sm {
      height: 34px;
      padding: 0 10px;
      font-size: 13px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: var(--radius-sm, 4px);
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s ease;
      outline: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .btn:hover {
      opacity: 0.9;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .btn:active {
      transform: translateY(0);
    }

    .btn-success {
      background-color: var(--color-success, #28a745);
      color: white;
    }

    .btn-success:hover {
      background-color: var(--color-success-dark, #218838);
    }

    .btn-danger {
      background-color: var(--color-destructive, #dc3545);
      color: white;
    }

    .btn-danger:hover {
      background-color: #c82333;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 13px;
    }

    .mb-3 {
      margin-bottom: var(--space-md, 16px);
    }

    :deep(.p-dialog .p-dialog-header) {
      background-color: var(--color-background, #ffffff);
      border-bottom: 1px solid var(--color-border, #e0e0e0);
      padding: var(--space-lg, 24px);
    }

    :deep(.p-dialog .p-dialog-header .p-dialog-title) {
      font-size: 18px;
      font-weight: 700;
      color: var(--color-foreground, #333);
    }

    :deep(.p-dialog .p-dialog-content) {
      padding: var(--space-lg, 24px);
    }

    :deep(.p-dialog .p-dialog-footer) {
      padding: var(--space-lg, 24px);
      border-top: 1px solid var(--color-border, #e0e0e0);
      background-color: var(--color-muted, #f9f9f9);
      display: flex;
      justify-content: flex-end;
      gap: var(--space-sm, 8px);
    }

    :deep(.p-button) {
      border-radius: var(--radius-sm, 4px);
      transition: all 0.2s ease;
      font-weight: 600;
    }

    :deep(.p-button-primary) {
      background-color: var(--color-primary, #0066cc);
      border-color: var(--color-primary, #0066cc);
    }

    :deep(.p-button-primary:hover) {
      background-color: var(--color-primary-dark, #0052a3);
      border-color: var(--color-primary-dark, #0052a3);
    }

    :deep(.p-button-secondary) {
      background-color: var(--color-muted-foreground, #666);
      border-color: var(--color-muted-foreground, #666);
    }

    :deep(.p-button-secondary:hover) {
      background-color: #555;
      border-color: #555;
    }

    @media (max-width: 1024px) {
      .form-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }

      :deep(.p-dialog) {
        width: 95%;
      }

      .table {
        font-size: 12px;
      }

      .table th,
      .table td {
        padding: var(--space-sm, 8px);
      }

      .btn {
        padding: 8px 16px;
        font-size: 13px;
      }
    }
  `],
  providers: [MessageService]
})
export class TicketModalComponent {
  @Output() onSave = new EventEmitter<TicketDTO>();
  @ViewChild('modal') modal: any;

  displayModal = false;
  isEditing = false;
  saving = false;

  ticketForm: FormGroup;
  productosRows: any[] = [];

  pacientes: any[] = [];
  terapeutas: any[] = [];
  espacios: any[] = [];
  productos: any[] = [];

  tipoTicketOptions = [
    { label: 'Cita', value: 'Cita' },
    { label: 'Préstamo', value: 'Prestamo' },
    { label: 'Venta', value: 'Venta' }
  ];

  modalidadOptions = [
    { label: 'Presencial', value: 'Presencial' },
    { label: 'Online', value: 'Online' }
  ];

  tipoUsoOptions = [
    { label: 'Venta', value: 'Venta' },
    { label: 'Préstamo', value: 'Prestamo' },
    { label: 'Uso', value: 'Uso' }
  ];

  private ticketsService: any = inject(TicketsService);
  private usuariosService: any = inject(UsersService);
  private espaciosService: any = inject(SpacesService);
  private inventarioService: any = inject(InventoryService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);

  constructor() {
    this.ticketForm = this.fb.group({
      tipoTicket: ['Cita', Validators.required],
      pacienteId: ['', Validators.required],
      terapeutaId: ['', Validators.required],
      espacioId: ['', Validators.required],
      fecha: ['', Validators.required],
      duracion: [60, [Validators.required, Validators.min(15)]],
      materia: [''],
      modalidad: ['Presencial'],
      costoAdicional: [0],
      montoPagado: [0],
      notas: ['']
    });
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.ticketForm.reset({
      tipoTicket: 'Cita',
      modalidad: 'Presencial',
      duracion: 60
    });
    this.productosRows = [];
    this.displayModal = true;
    this.loadCommonData();
  }

  openEditModal(ticket: TicketDTO): void {
    this.isEditing = true;
    this.ticketForm.patchValue({
      tipoTicket: ticket.tipoTicket || 'Cita',
      pacienteId: ticket.pacienteId,
      terapeutaId: ticket.terapeutaId,
      espacioId: ticket.espacioId,
      fecha: ticket.fecha ? new Date(ticket.fecha) : new Date(),
      duracion: ticket.duracion,
      materia: ticket.materia,
      modalidad: ticket.modalidad,
      costoAdicional: ticket.costoAdicional,
      montoPagado: ticket.montoPagado,
      notas: (ticket as any).notas
    });
    this.productosRows = ticket.detalles || [];
    this.displayModal = true;
    this.loadCommonData();
  }

  private loadCommonData(): void {
    this.usuariosService.obtenerPacientes().subscribe({
      next: (data: any) => this.pacientes = data,
      error: (err: any) => console.error('Error loading pacientes:', err)
    });
    
    this.usuariosService.obtenerTerapeutas().subscribe({
      next: (data: any) => this.terapeutas = data,
      error: (err: any) => console.error('Error loading terapeutas:', err)
    });

    this.espaciosService.obtenerEspacios().subscribe({
      next: (data: any) => this.espacios = data,
      error: (err: any) => console.error('Error loading espacios:', err)
    });

    this.inventarioService.obtenerProductos().subscribe({
      next: (data: any) => this.productos = data,
      error: (err: any) => console.error('Error loading productos:', err)
    });
  }

  onTipoTicketChange(): void {
    // Lógica adicional si cambio el tipo de ticket
  }

  onProductoChange(row: any): void {
    const producto = this.productos.find(p => p.productoId === row.productoId);
    if (producto) {
      row.precioUnitario = producto.precio;
      this.calculateRowSubtotal(row);
    }
  }

  calculateRowSubtotal(row: any): void {
    row.subtotal = (row.precioUnitario || 0) * (row.cantidad || 0);
  }

  addProductRow(): void {
    this.productosRows.push({
      productoId: null,
      cantidad: 1,
      tipoUso: 'Venta',
      precioUnitario: 0,
      subtotal: 0,
      fechaDevolucionEstimada: null
    });
  }

  removeProductRow(index: number): void {
    this.productosRows.splice(index, 1);
  }

  saveTicket(): void {
    if (!this.ticketForm.valid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Complete todos los campos requeridos'
      });
      return;
    }

    this.saving = true;

    const ticket: TicketDTO = {
      ...this.ticketForm.value,
      fecha: new Date(this.ticketForm.value.fecha).toISOString(),
      productos: this.productosRows.filter(r => r.productoId)
    } as TicketDTO;

    const request = this.isEditing
      ? this.ticketsService.actualizarTicket(ticket as any)
      : this.ticketsService.crearTicket(ticket);

    request.subscribe({
      next: (result: any) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: this.isEditing ? 'Ticket actualizado' : 'Ticket creado'
        });
        this.onSave.emit(result);
        this.displayModal = false;
        this.saving = false;
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Error al guardar el ticket'
        });
        this.saving = false;
      }
    });
  }

  onCancel(): void {
    this.displayModal = false;
  }

  onModalClose(): void {
    this.ticketForm.reset();
    this.productosRows = [];
  }
}