import { Component, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule } from 'primeng/paginator';
import { TicketsService } from '../../../core/services/tickets.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TicketFiltroResponseDTO } from '../../../core/models/api-models';

@Component({
  selector: 'app-tickets-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
    TagModule,
    TooltipModule,
    PaginatorModule
  ],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="tickets-container">
      <div class="tickets-header">
        <h1>Gestión de Tickets</h1>
        <div class="header-actions">
          <button pButton 
            type="button" 
            label="+ Nuevo Ticket" 
            icon="pi pi-plus"
            class="p-button-success"
            (click)="createNewTicket()">
          </button>
        </div>
      </div>

      <div class="filters-bar">
        <div class="filter-group">
          <label class="filter-label">Estado</label>
          <div class="select-wrapper">
            <select [(ngModel)]="filtro.estadoTicket" (change)="applyFilter()" class="custom-select">
              <option value="">Todos</option>
              <option value="BORRADOR">Borrador</option>
              <option value="AGENDADO">Agendado</option>
              <option value="EN_PROGRESO">En progreso</option>
              <option value="COMPLETADO">Completado</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
            <span class="select-arrow">▼</span>
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-label">Buscar</label>
          <input type="text"
            [(ngModel)]="searchTerm" 
            placeholder="Folio o paciente..."
            (input)="applyFilter()"
            class="custom-select"
            style="padding: 0 12px;">
        </div>

        <div class="filter-actions">
          <button pButton 
            type="button" 
            label="Limpiar" 
            icon="pi pi-times"
            class="p-button-text"
            (click)="applyFilter()">
          </button>
        </div>
      </div>

      <div class="table-card">
        <div class="table-container" *ngIf="!loading && tickets.length > 0">
          <table class="tickets-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Folio</th>
                <th>Paciente</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Financiero</th>
                <th>Monto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let ticket of tickets; trackBy: trackByTicketId">
                <td>{{ ticket.ticketId }}</td>
                <td><strong>{{ ticket.folio }}</strong></td>
                <td>{{ ticket.pacienteNombre }}</td>
                <td>{{ ticket.fechaCreacion | date:'dd/MM/yyyy HH:mm' }}</td>
                <td>
                  <p-tag [value]="ticket.estadoTicket" [severity]="getStatusSeverity(ticket.estadoTicket)"></p-tag>
                </td>
                <td>
                  <p-tag [value]="ticket.estadoFinanciero" [severity]="getFinancialSeverity(ticket.estadoFinanciero)"></p-tag>
                </td>
                <td>{{ ticket.montoTotal | currency }}</td>
                <td>
                  <div class="action-buttons">
                    <button pButton 
                      type="button" 
                      icon="pi pi-pencil" 
                      class="p-button-rounded p-button-text p-button-plain"
                      (click)="editTicket(ticket)"
                      pTooltip="Editar">
                    </button>
                    <button pButton 
                      type="button" 
                      icon="pi pi-trash" 
                      class="p-button-rounded p-button-text p-button-danger"
                      (click)="confirmDelete(ticket)"
                      pTooltip="Eliminar">
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="empty-container" *ngIf="!loading && tickets.length === 0">
          <p>No hay tickets disponibles</p>
        </div>

        <div class="loading-container" *ngIf="loading">
          <p>Cargando tickets...</p>
        </div>

        <div class="paginator-container" *ngIf="tickets.length > 0">
          <p-paginator 
            [rows]="10" 
            [totalRecords]="totalRecords" 
            [rowsPerPageOptions]="[5, 10, 20, 50]"
            (onPageChange)="onPageChange($event)">
          </p-paginator>
        </div>
      </div>

      <div class="table-footer">
        <div class="stats">
          <div class="stat-item">
            <span class="stat-label">Total de tickets</span>
            <span class="stat-value">{{ totalRecords }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Mostrando</span>
            <span class="stat-value">{{ tickets.length }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .tickets-container {
      display: flex;
      flex-direction: column;
      gap: var(--space-lg, 24px);
      max-width: 1600px;
      margin: 0 auto;
      padding: var(--space-lg, 24px);
    }

    .tickets-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-md, 16px);
    }

    .tickets-header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      color: var(--color-foreground, #333);
    }

    .header-actions {
      display: flex;
      gap: var(--space-sm, 8px);
    }

    .filters-bar {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-md, 16px);
      align-items: flex-end;
      padding: var(--space-md, 16px);
      background-color: var(--color-card, #ffffff);
      border: 1px solid var(--color-border, #e0e0e0);
      border-radius: var(--radius-md, 8px);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 160px;
    }

    .filter-label {
      font-size: 12px;
      font-weight: 700;
      color: var(--color-muted-foreground, #666);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .select-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .custom-select {
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

    .custom-select:hover {
      border-color: var(--color-primary, #0066cc);
    }

    .custom-select:focus {
      border-color: var(--color-primary, #0066cc);
      box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
    }

    .select-arrow {
      position: absolute;
      right: 10px;
      pointer-events: none;
      color: var(--color-muted-foreground, #666);
      font-size: 12px;
    }

    .filter-actions {
      display: flex;
      gap: var(--space-sm, 8px);
    }

    .table-card {
      background-color: var(--color-card, #ffffff);
      border: 1px solid var(--color-border, #e0e0e0);
      border-radius: var(--radius-md, 8px);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .table-container {
      overflow-x: auto;
      overflow-y: auto;
      max-height: calc(100vh - 400px);
      flex: 1;
    }

    .tickets-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    .tickets-table thead {
      position: sticky;
      top: 0;
      background-color: var(--color-muted, #f9f9f9);
      border-bottom: 2px solid var(--color-border, #e0e0e0);
      z-index: 10;
    }

    .tickets-table thead th {
      padding: var(--space-md, 16px);
      text-align: left;
      font-size: 12px;
      font-weight: 700;
      color: var(--color-muted-foreground, #666);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }

    .tickets-table tbody tr {
      border-bottom: 1px solid var(--color-border, #e0e0e0);
      transition: background-color 0.2s ease;
    }

    .tickets-table tbody tr:hover {
      background-color: var(--color-muted, #f9f9f9);
    }

    .tickets-table tbody td {
      padding: var(--space-md, 16px);
      color: var(--color-foreground, #333);
    }

    .tickets-table tbody td strong {
      font-weight: 700;
      color: var(--color-foreground, #333);
    }

    .action-buttons {
      display: flex;
      gap: var(--space-sm, 8px);
      align-items: center;
    }

    .empty-container,
    .loading-container {
      padding: var(--space-lg, 24px);
      text-align: center;
      color: var(--color-muted-foreground, #666);
      font-size: 14px;
    }

    .paginator-container {
      padding: var(--space-md, 16px);
      border-top: 1px solid var(--color-border, #e0e0e0);
      background-color: var(--color-muted, #f9f9f9);
    }

    :deep(.p-paginator) {
      background: transparent;
      border: none;
      padding: 0;
    }

    .table-footer {
      padding: var(--space-md, 16px);
      background-color: var(--color-muted, #f9f9f9);
      border-top: 1px solid var(--color-border, #e0e0e0);
      display: flex;
      justify-content: flex-end;
      gap: var(--space-lg, 24px);
    }

    .stats {
      display: flex;
      gap: var(--space-lg, 24px);
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .stat-label {
      font-size: 12px;
      color: var(--color-muted-foreground, #666);
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.05em;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--color-primary, #0066cc);
    }

    :deep(.p-button) {
      border-radius: var(--radius-sm, 4px);
      transition: all 0.2s ease;
    }

    :deep(.p-button-success) {
      background-color: var(--color-success, #28a745);
      border-color: var(--color-success, #28a745);
    }

    :deep(.p-button-success:hover) {
      background-color: var(--color-success-dark, #218838);
      border-color: var(--color-success-dark, #218838);
    }

    :deep(.p-button-text) {
      color: var(--color-muted-foreground, #666);
    }

    :deep(.p-button-text:hover) {
      background-color: var(--color-muted, #f9f9f9);
    }

    :deep(.p-tag) {
      border-radius: var(--radius-sm, 4px);
      font-weight: 600;
      font-size: 12px;
    }

    @media (max-width: 1024px) {
      .tickets-container {
        padding: var(--space-md, 16px);
      }

      .filters-bar {
        gap: var(--space-sm, 8px);
      }
    }

    @media (max-width: 768px) {
      .tickets-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .filters-bar {
        flex-direction: column;
      }

      .filter-group {
        width: 100%;
      }

      .table-container {
        max-height: calc(100vh - 300px);
      }

      .table-footer {
        flex-direction: column;
        gap: var(--space-md, 16px);
      }

      .stats {
        width: 100%;
        justify-content: space-around;
      }
    }
  `],
  providers: [MessageService, ConfirmationService]
})
export class TicketsTableComponent implements OnInit {

  @Output() onCreateClick = new EventEmitter<void>();
  @Output() onEditTicket = new EventEmitter<number>();
  @Output() onRefreshTable = new EventEmitter<void>();

  tickets: TicketFiltroResponseDTO[] = [];
  filtro: TicketFiltroResponseDTO = {
    ticketId: 0,
    folio: '',
    creadoPorNombre: '',
    creadoPorEmail: '',
    estadoTicket: '',
    estadoFinanciero: '',
    montoTotal: 0,
    montoPagado: 0,
    saldoPendiente: 0,
    fechaCreacion: ''
  };
  searchTerm: string = '';
  loading: boolean = false;
  totalRecords: number = 0;

  estadoOptions = [
    { label: 'Todos', value: null },
    { label: 'Borrador', value: 'BORRADOR' },
    { label: 'Agendado', value: 'AGENDADO' },
    { label: 'En progreso', value: 'EN_PROGRESO' },
    { label: 'Completado', value: 'COMPLETADO' },
    { label: 'Cancelado', value: 'CANCELADO' }
  ];

  private ticketsService: any = inject(TicketsService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.loading = true;
    this.ticketsService.obtenerTickets(this.filtro).subscribe({
      next: (data: any) => {
        this.tickets = data;
        this.totalRecords = data.length;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading tickets:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar los tickets'
        });
        this.loading = false;
      }
    });
  }

  applyFilter(): void {
    this.filtro = {
      ...this.filtro,
      estadoTicket: this.filtro.estadoTicket
    };
    this.loadTickets();
  }

  createNewTicket(): void {
    this.onCreateClick.emit();
  }

  editTicket(ticket: TicketFiltroResponseDTO): void {
    this.onEditTicket.emit(ticket.ticketId);
  }

  confirmDelete(ticket: TicketFiltroResponseDTO): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea eliminar el ticket ${ticket.folio}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteTicketConfirmed(ticket.ticketId!);
      }
    });
  }

  private deleteTicketConfirmed(ticketId: number): void {
    this.loading = true;
    this.ticketsService.eliminarTicket(ticketId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Ticket eliminado correctamente'
        });
        this.loadTickets();
      },
      error: (err: any) => {
        console.error('Error deleting ticket:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'No se pudo eliminar el ticket'
        });
        this.loading = false;
      }
    });
  }

  getStatusSeverity(status: string | undefined): 'secondary' | 'success' | 'info' | 'danger' | 'warn' | 'contrast' | null | undefined {
    switch (status) {
      case 'BORRADOR': return 'secondary';
      case 'AGENDADO': return 'warn';
      case 'EN_PROGRESO': return 'info';
      case 'COMPLETADO': return 'success';
      case 'CANCELADO': return 'danger';
      default: return 'secondary';
    }
  }

  getFinancialSeverity(status: string | undefined): 'secondary' | 'success' | 'info' | 'danger' | 'warn' | 'contrast' | null | undefined {
    switch (status) {
      case 'PENDIENTE': return 'warn';
      case 'PAGO_PARCIAL': return 'info';
      case 'EN_REVISION': return 'secondary';
      case 'PAGADO': return 'success';
      case 'REEMBOLSADO': return 'danger';
      default: return 'secondary';
    }
  }

  trackByTicketId(index: number, ticket: TicketFiltroResponseDTO): number {
    return ticket.ticketId || index;
  }

  onPageChange(event: any): void {
    console.log('Page changed:', event);
    // Implementar paginación si es necesario
  }
}
