import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';

import { TicketsService } from '../../../../core/services/tickets.service';
import { UsersService } from '../../../../core/services/users.service';
import { SpacesService } from '../../../../core/services/spaces.service';
import { InventoryService } from '../../../../core/services/inventory.service';
import { CalendarService } from '../../../../core/services/calendar.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  TicketRequestDTO,
  TicketVentaRequestDTO,
  TicketCitaRequestDTO,
  TicketEspacioRequestDTO,
  TicketPrestamoRequestDTO,
  TimeSlot,
} from '../../../../core/models/api-models';
import { UserRole } from '../../../../core/models/enums';

// ============================================
// INTERFACES PARA BUILDER PATTERN
// ============================================

export interface SharedTicketContext {
  masterDate?: string;          // YYYY-MM-DD
  masterHoraInicio?: string;    // HH:mm
  masterHoraFin?: string;       // HH:mm
  masterEspacioId?: number;
  masterUsuarioId?: number;
}

export type ModuleType = 'CITA' | 'VENTA' | 'ESPACIO' | 'PRESTAMO';

export interface ActiveModule {
  id: string;
  type: ModuleType;
  data: ModuleCitaData | ModuleVentaData | ModuleEspacioData | ModulePrestamoData;
}

export interface ModuleCitaData {
  pacienteId: number;
  terapeutaId: number;
  fechaInicio: string;        // ISO datetime
  fechaFin: string;           // ISO datetime
  precioCobrado: number;
  notasTerapia: string;
  modalidad: 'Presencial' | 'Online';
}

export interface ModuleVentaData {
  items: TicketVentaRequestDTO[];
}

export interface ModuleEspacioData {
  espacioId: number;
  fecha: string;              // YYYY-MM-DD
  horaInicio: string;         // HH:mm
  horaFin: string;            // HH:mm
  costoCobrado: number;
  loadingSlots: boolean;
  availableSlots: TimeSlot[];
}

export interface ModulePrestamoData {
  items: TicketPrestamoRequestDTO[];
}

@Component({
  selector: 'app-ticket-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ticket-create.component.html',
  styleUrls: ['./ticket-create.component.css'],
})
export class TicketCreateComponent {
  private ticketsService = inject(TicketsService);
  private usersService = inject(UsersService);
  private spacesService = inject(SpacesService);
  private inventoryService = inject(InventoryService);
  private calendarService = inject(CalendarService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // ============================================
  // ESTADO DEL BUILDER
  // ============================================

  sharedContext = signal<SharedTicketContext>({});
  activeModules = signal<ActiveModule[]>([]);
  
  costoAdicional = signal(0);
  motivoCostoAdicional = signal('');
  
  loading = signal(false);
  errorMessage = signal('');

  // ============================================
  // CATÁLOGOS
  // ============================================

  pacientesResource = rxResource({
    stream: () => this.usersService.getActiveUsersByRole(UserRole.PACIENTE),
  });

  terapeutasResource = rxResource({
    stream: () => this.usersService.getActiveUsersByRole(UserRole.TERAPEUTA),
  });

  espaciosResource = rxResource({
    stream: () => this.spacesService.getActive(),
  });

  productosResource = rxResource({
    stream: () => this.inventoryService.getAllProductsPaginable(),
  });

  pacientes = computed(() => this.pacientesResource.value()?.data || []);
  terapeutas = computed(() => this.terapeutasResource.value()?.data || []);
  espaciosCatalogo = computed(() => {
    const response = this.espaciosResource.value();
    if (!response) return [];
    return Array.isArray(response) ? response : response.data || [];
  });
  productosCatalogo = computed(() => {
    const response = this.productosResource.value();
    if (!response) return [];
    return Array.isArray(response) ? response : response.data || [];
  });

  // ============================================
  // COMPUTED TOTALS
  // ============================================

  totalVentas = computed(() => {
    const ventasModules = this.activeModules().filter(m => m.type === 'VENTA');
    return ventasModules.reduce((sum, m) => {
      const data = m.data as ModuleVentaData;
      return sum + data.items.reduce((s, item) => s + (item.cantidad || 0) * (item.precioUnitario || 0), 0);
    }, 0);
  });

  totalEspacios = computed(() => {
    const espaciosModules = this.activeModules().filter(m => m.type === 'ESPACIO');
    return espaciosModules.reduce((sum, m) => {
      const data = m.data as ModuleEspacioData;
      return sum + (data.costoCobrado || 0);
    }, 0);
  });

  totalCita = computed(() => {
    const citaModule = this.activeModules().find(m => m.type === 'CITA');
    if (!citaModule) return 0;
    const data = citaModule.data as ModuleCitaData;
    return data.precioCobrado || 0;
  });

  totalGeneral = computed(() => 
    this.totalCita() + this.totalVentas() + this.totalEspacios() + this.costoAdicional()
  );

  // Computed para detectar si hay cita presencial
  hasPresencialCita = computed(() => {
    const citaModule = this.activeModules().find(m => m.type === 'CITA');
    if (!citaModule) return false;
    const data = citaModule.data as ModuleCitaData;
    return data.modalidad === 'Presencial';
  });

  // Computed para detectar si ya existe módulo CITA
  hasCitaModule = computed(() => {
    return this.activeModules().some(m => m.type === 'CITA');
  });

  // Computed para detectar si existe módulo ESPACIO
  hasEspacioModule = computed(() => {
    return this.activeModules().some(m => m.type === 'ESPACIO');
  });

  // ============================================
  // CONSTRUCTOR & EFFECTS
  // ============================================

  constructor() {
    // Effect: Actualizar sharedContext cuando cambia la CITA
    effect(() => {
      const citaModule = this.activeModules().find(m => m.type === 'CITA');
      if (citaModule) {
        const data = citaModule.data as ModuleCitaData;
        if (data.fechaInicio) {
          const [date, time] = data.fechaInicio.split('T');
          const horaInicio = time ? time.substring(0, 5) : undefined;
          
          let horaFin: string | undefined;
          if (data.fechaFin) {
            const timeFin = data.fechaFin.split('T')[1];
            horaFin = timeFin ? timeFin.substring(0, 5) : undefined;
          }
          
          this.sharedContext.update(ctx => ({
            ...ctx,
            masterDate: date,
            masterHoraInicio: horaInicio,
            masterHoraFin: horaFin,
          }));
        }
      }
    });

    // Effect: Cargar parámetros de URL
    effect(() => {
      const params = this.route.snapshot.queryParamMap;
      const fecha = params.get('fecha');
      const horaInicio = params.get('horaInicio');
      const horaFin = params.get('horaFin');
      const espacioId = params.get('espacioId');

      if (fecha && horaInicio) {
        // Auto-agregar módulo CITA si viene desde calendario
        if (this.activeModules().length === 0) {
          this.addModule('CITA');
        }
        
        // Actualizar sharedContext
        this.sharedContext.set({
          masterDate: fecha,
          masterHoraInicio: horaInicio,
          masterHoraFin: horaFin || undefined,
          masterEspacioId: espacioId ? Number(espacioId) : undefined,
        });
      }
    });
  }

  // ============================================
  // MODULE MANAGEMENT
  // ============================================

  addModule(type: ModuleType): void {
    const id = `${type}_${Date.now()}`;
    const data = this.createModuleDefaultData(type);
    this.activeModules.update(modules => [
      ...modules,
      { id, type, data }
    ]);
  }

  removeModule(id: string): void {
    this.activeModules.update(modules => modules.filter(m => m.id !== id));
  }

  createModuleDefaultData(type: ModuleType): any {
    const ctx = this.sharedContext();
    
    switch (type) {
      case 'CITA':
        const fechaInicio = ctx.masterDate && ctx.masterHoraInicio 
          ? `${ctx.masterDate}T${ctx.masterHoraInicio}:00`
          : '';
        const fechaFin = ctx.masterDate && ctx.masterHoraFin 
          ? `${ctx.masterDate}T${ctx.masterHoraFin}:00`
          : '';
        
        return {
          pacienteId: 0,
          terapeutaId: 0,
          fechaInicio,
          fechaFin,
          precioCobrado: 0,
          notasTerapia: '',
          modalidad: 'Presencial' as const,
        } as ModuleCitaData;
        
      case 'VENTA':
        return {
          items: [{ productoId: 0, cantidad: 1, precioUnitario: 0 }]
        } as ModuleVentaData;
        
      case 'ESPACIO':
        const espacioData: ModuleEspacioData = {
          espacioId: ctx.masterEspacioId || 0,
          fecha: ctx.masterDate || '',
          horaInicio: ctx.masterHoraInicio || '',
          horaFin: ctx.masterHoraFin || '',
          costoCobrado: 0,
          loadingSlots: false,
          availableSlots: [],
        };
        
        // Cargar slots si hay espacioId y fecha
        if (espacioData.espacioId && espacioData.fecha) {
          this.loadSlotsForEspacio(espacioData);
        }
        
        return espacioData;
        
      case 'PRESTAMO':
        return {
          items: [{
            productoId: 0,
            responsableId: 0,
            fechaPrestamo: '',
            fechaDevolucionEstimada: '',
          }]
        } as ModulePrestamoData;
        
      default:
        return {};
    }
  }

  updateModuleData(id: string, data: any): void {
    this.activeModules.update(modules =>
      modules.map(m => m.id === id ? { ...m, data } : m)
    );
  }

  // ============================================
  // ESPACIO: SLOT LOADING
  // ============================================

  loadSlotsForEspacio(espacioData: ModuleEspacioData): void {
    if (!espacioData.espacioId || !espacioData.fecha) return;
    
    espacioData.loadingSlots = true;
    this.calendarService.getSlotsDisponibles(espacioData.espacioId, espacioData.fecha).subscribe({
      next: (response) => {
        espacioData.loadingSlots = false;
        const slots = response.data?.slots || [];
        espacioData.availableSlots = slots.filter((s: TimeSlot) => s.estado === 'DISPONIBLE');
      },
      error: (err) => {
        espacioData.loadingSlots = false;
        console.error('Error cargando slots:', err);
        espacioData.availableSlots = [];
      }
    });
  }

  onEspacioChanged(moduleId: string, espacioId: number): void {
    const module = this.activeModules().find(m => m.id === moduleId);
    if (!module) return;
    
    const data = module.data as ModuleEspacioData;
    data.espacioId = espacioId;
    
    if (data.fecha) {
      this.loadSlotsForEspacio(data);
    }
    
    this.updateModuleData(moduleId, data);
  }

  onEspacioFechaChanged(moduleId: string, fecha: string): void {
    const module = this.activeModules().find(m => m.id === moduleId);
    if (!module) return;
    
    const data = module.data as ModuleEspacioData;
    data.fecha = fecha;
    
    if (data.espacioId) {
      this.loadSlotsForEspacio(data);
    }
    
    this.updateModuleData(moduleId, data);
  }

  // ============================================
  // VENTA: ROW MANAGEMENT
  // ============================================

  addVentaRow(moduleId: string): void {
    const module = this.activeModules().find(m => m.id === moduleId);
    if (!module) return;
    
    const data = module.data as ModuleVentaData;
    data.items.push({ productoId: 0, cantidad: 1, precioUnitario: 0 });
    this.updateModuleData(moduleId, data);
  }

  removeVentaRow(moduleId: string, index: number): void {
    const module = this.activeModules().find(m => m.id === moduleId);
    if (!module) return;
    
    const data = module.data as ModuleVentaData;
    data.items = data.items.filter((_, i) => i !== index);
    this.updateModuleData(moduleId, data);
  }

  onProductoVentaChange(moduleId: string, index: number, productoId: number): void {
    const module = this.activeModules().find(m => m.id === moduleId);
    if (!module) return;
    
    const data = module.data as ModuleVentaData;
    const productos = this.productosCatalogo();
    const producto = productos.find((p: any) => p.productoId === productoId);
    
    if (producto) {
      data.items[index].productoId = productoId;
      data.items[index].precioUnitario = producto.precio || 0;
      this.updateModuleData(moduleId, data);
    }
  }

  // ============================================
  // PRESTAMO: ROW MANAGEMENT
  // ============================================

  addPrestamoRow(moduleId: string): void {
    const module = this.activeModules().find(m => m.id === moduleId);
    if (!module) return;
    
    const data = module.data as ModulePrestamoData;
    data.items.push({
      productoId: 0,
      responsableId: 0,
      fechaPrestamo: '',
      fechaDevolucionEstimada: '',
    });
    this.updateModuleData(moduleId, data);
  }

  removePrestamoRow(moduleId: string, index: number): void {
    const module = this.activeModules().find(m => m.id === moduleId);
    if (!module) return;
    
    const data = module.data as ModulePrestamoData;
    data.items = data.items.filter((_, i) => i !== index);
    this.updateModuleData(moduleId, data);
  }

  // ============================================
  // NAVIGATION & SAVE
  // ============================================

  goBack(): void {
    this.router.navigate(['/tickets']);
  }

  saveTicket(estadoTicket: 'BORRADOR' | 'AGENDADO'): void {
    this.errorMessage.set('');

    const currentUser = this.authService.currentUser();
    const creadoPorId = currentUser?.id ? Number(currentUser.id) : 0;

    if (!creadoPorId) {
      this.errorMessage.set('No se pudo identificar el usuario actual.');
      return;
    }

    // Validar CITA si existe
    const citaModule = this.activeModules().find(m => m.type === 'CITA');
    let cita: TicketCitaRequestDTO | undefined;
    
    if (citaModule) {
      const citaData = citaModule.data as ModuleCitaData;
      
      if (!citaData.pacienteId || !citaData.terapeutaId || !citaData.fechaInicio || !citaData.fechaFin) {
        this.errorMessage.set('Completa los datos obligatorios de la cita.');
        return;
      }
      
      // Validar modalidad presencial requiere cubículo
      if (citaData.modalidad === 'Presencial') {
        const espaciosModules = this.activeModules().filter(m => m.type === 'ESPACIO');
        if (espaciosModules.length === 0) {
          this.errorMessage.set('Las citas presenciales requieren un cubículo asignado.');
          return;
        }
      }
      
      cita = {
        pacienteId: citaData.pacienteId,
        terapeutaId: citaData.terapeutaId,
        fechaInicio: citaData.fechaInicio,
        fechaFin: citaData.fechaFin,
        precioCobrado: citaData.precioCobrado || 0,
        notasTerapia: citaData.notasTerapia,
        modalidad: citaData.modalidad,
      };
    }

    // Recolectar VENTAS
    const ventasModules = this.activeModules().filter(m => m.type === 'VENTA');
    const ventas: TicketVentaRequestDTO[] = [];
    ventasModules.forEach(m => {
      const data = m.data as ModuleVentaData;
      ventas.push(...data.items.filter(item => item.productoId > 0));
    });

    // Recolectar ESPACIOS
    const espaciosModules = this.activeModules().filter(m => m.type === 'ESPACIO');
    const espacios: TicketEspacioRequestDTO[] = [];
    espaciosModules.forEach(m => {
      const data = m.data as ModuleEspacioData;
      if (data.espacioId && data.fecha && data.horaInicio && data.horaFin) {
        espacios.push({
          espacioId: data.espacioId,
          horaInicioReserva: `${data.fecha}T${data.horaInicio}:00`,
          horaFinReserva: `${data.fecha}T${data.horaFin}:00`,
          costoCobrado: data.costoCobrado || 0,
        });
      }
    });

    // Recolectar PRÉSTAMOS
    const prestamosModules = this.activeModules().filter(m => m.type === 'PRESTAMO');
    const prestamos: TicketPrestamoRequestDTO[] = [];
    prestamosModules.forEach(m => {
      const data = m.data as ModulePrestamoData;
      prestamos.push(...data.items.filter(item => item.productoId > 0));
    });

    const payload: TicketRequestDTO = {
      creadoPorId,
      estadoTicket,
      estadoFinanciero: 'PENDIENTE',
      ventas,
      cita,
      espacios,
      prestamos,
      costoAdicional: this.costoAdicional() || 0,
      motivoCostoAdicional: this.motivoCostoAdicional() || undefined,
    };

    this.loading.set(true);
    this.ticketsService.crearTicket(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/tickets']);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(error?.error?.message || 'No se pudo crear el ticket.');
      },
    });
  }
}
