import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { API_BASE } from './api.config';
import {
  DataResponseDTO,
  BaseResponseDTO,
  CitaDTO,
  ConfiguracionHorariosDTO,
  EspacioDTO,
  TicketResponseDTO,
} from '../models/api-models';
import { AppointmentSlot, Cubiculo, DayScheduleConfig } from '../models/models';
import { ErrorHandlerService } from './errorHandler.service';

export interface CrearCitaDTO {
  espacioId: number;
  fecha: string; // ISO string
  duracion: number; // Duración en minutos
  pacienteId: number;
  terapeutaId: number;
  materia: string;
  modalidad: 'Presencial' | 'Online';
  notas?: string;
  montoPagado?: number;
  costoAdicional?: number;
  productos?: ProductoCitaRequest[];
  cuentaDestinoId: number;
}

export interface ActualizarCitaDTO {
  espacioId?: number;
  fecha?: string;
  duracion?: number;
  pacienteId?: number;
  terapeutaId?: number;
  materia?: string;
  modalidad?: 'Presencial' | 'Online';
  estadoTicket?: string;
  notas?: string;
  costoAdicional?: number;
  productos?: ProductoCitaRequest[];
}

export interface ProductoCitaRequest {
  productoId: number;
  cantidad: number;
  precioUnitario?: number;
  tipoUso: 'Venta' | 'Prestamo' | 'Uso';
  fechaDevolucionEstimada?: string;
  observaciones?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  private http = inject(HttpClient);
  private errorHandler = inject(ErrorHandlerService);

  /**
   * Obtener citas con filtros
   */
  getCitas(filters?: {
    fechaInicio?: string;
    fechaFin?: string;
    timeStart?: string;
    timeEnd?: string;
    espacioId?: number;
    terapeutaId?: number;
    pacienteId?: number;
    estado?: string;
  }): Observable<DataResponseDTO<CitaDTO[]>> {
    let params = new HttpParams();

    // Usar timeStart/timeEnd si se proporcionan, sino construir desde fecha
    let timeStart = filters?.timeStart;
    let timeEnd = filters?.timeEnd;

    if (!timeStart && filters?.fechaInicio) {
      timeStart = !filters.fechaInicio.includes('T') 
        ? `${filters.fechaInicio}T00:00:00` 
        : filters.fechaInicio;
    }
    if (!timeEnd && filters?.fechaFin) {
      timeEnd = !filters.fechaFin.includes('T') 
        ? `${filters.fechaFin}T23:59:59` 
        : filters.fechaFin;
    }

    if (timeStart) params = params.set('timeStart', timeStart);
    if (timeEnd) params = params.set('timeEnd', timeEnd);
    if (filters?.espacioId) params = params.set('espacioId', filters.espacioId.toString());
    if (filters?.terapeutaId) params = params.set('terapeutaId', filters.terapeutaId.toString());
    if (filters?.pacienteId) params = params.set('pacienteId', filters.pacienteId.toString());
    if (filters?.estado) params = params.set('estado', filters.estado);

    return this.http.get<DataResponseDTO<any>>(`${API_BASE}/tickets`, { params }).pipe(
      map((response) => {
        console.log('📦 Response del backend:', response);
        const data = response.data as any;
        // El backend retorna una Page<TicketFiltroDTO> con propiedad 'content'
        const items = Array.isArray(data) ? data : data?.content ?? [];
        console.log('📋 Items extraídos del response:', items);
        
        const citas = items
          .map((ticket: any) => this.mapTicketToCitaDTO(ticket))
          .filter((item: CitaDTO | null): item is CitaDTO => item !== null);

        console.log('🎬 Citas finales mapeadas:', citas);
        return {
          ...response,
          data: citas,
        } as DataResponseDTO<CitaDTO[]>;
      }),
      tap(() => console.log('Citas obtenidas con filtros:', { timeStart, timeEnd })),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Obtener citas');
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener espacios disponibles (cubículos)
   */
  getEspacios(): Observable<DataResponseDTO<any[]>> {
    return this.http.get<DataResponseDTO<any[]>>(`${API_BASE}/espacios`).pipe(
      tap(() => console.log('Espacios obtenidos')),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Obtener espacios');
        return throwError(() => error);
      })
    );
  }

  /**
   * Crear nueva cita
   */
  crearCita(citaData: CrearCitaDTO): Observable<DataResponseDTO<CitaDTO>> {
    return this.http.post<DataResponseDTO<CitaDTO>>(`${API_BASE}/citas`, citaData).pipe(
      tap(() => {
        console.log('Cita creada');
        this.errorHandler.showSuccess('Cita creada', 'La cita se agendo correctamente');
      }),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Crear cita');
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualizar cita existente
   */
  actualizarCita(
    citaId: number,
    citaData: ActualizarCitaDTO
  ): Observable<DataResponseDTO<CitaDTO>> {
    return this.http.put<DataResponseDTO<CitaDTO>>(`${API_BASE}/citas/${citaId}`, citaData).pipe(
      tap(() => {
        console.log('Cita actualizada');
        this.errorHandler.showSuccess('Cita actualizada', 'Los cambios se guardaron correctamente');
      }),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Actualizar cita');
        return throwError(() => error);
      })
    );
  }

  /**
   * Eliminar cita
   */
  eliminarCita(citaId: number): Observable<BaseResponseDTO> {
    return this.http.delete<BaseResponseDTO>(`${API_BASE}/citas/${citaId}`).pipe(
      tap(() => {
        console.log('Cita eliminada');
        this.errorHandler.showSuccess('Cita eliminada', 'La cita se elimino correctamente');
      }),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Eliminar cita');
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener configuración de horarios para una fecha
   */
  getConfiguracionHorarios(
    fecha: string,
    espacioId: number
  ): Observable<DataResponseDTO<ConfiguracionHorariosDTO>> {
    return this.http
      .get<DataResponseDTO<ConfiguracionHorariosDTO>>(`${API_BASE}/configuracion-horarios`, {
        params: { fecha, espacioId: espacioId.toString() },
      })
      .pipe(
        tap(() => console.log('Configuracion de horarios obtenida')),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Obtener configuración horarios');
          return throwError(() => error);
        })
      );
  }

  /**
   * Guardar configuración de horarios
   */
  guardarConfiguracionHorarios(configData: {
    espacioId: number;
    fecha: string;
    horasDeshabilitadas: string[];
  }): Observable<DataResponseDTO<ConfiguracionHorariosDTO>> {
    return this.http
      .post<DataResponseDTO<ConfiguracionHorariosDTO>>(
        `${API_BASE}/configuracion-horarios`,
        configData
      )
      .pipe(
        tap(() => {
          console.log('Configuracion guardada');
          this.errorHandler.showSuccess(
            'Configuracion guardada',
            'Los horarios se actualizaron correctamente'
          );
        }),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Guardar configuración horarios');
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener horarios disponibles considerando configuración por defecto
   */
  getHorariosDisponibles(espacioId: number, fecha: string): Observable<DataResponseDTO<string[]>> {
    return this.http
      .get<DataResponseDTO<string[]>>(`${API_BASE}/configuracion-horarios/horarios-disponibles`, {
        params: { espacioId: espacioId.toString(), fecha },
      })
      .pipe(
        map((response) => {
          // Si no hay horarios configurados, usar horarios por defecto
          if (!response.data || response.data.length === 0) {
            const date = new Date(fecha);
            const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Lunes, etc.

            // Horario por defecto: Lunes a Viernes de 7:00 a 18:00
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
              const defaultSlots = this.generateDefaultTimeSlots();
              return {
                ...response,
                data: defaultSlots,
              };
            } else {
              // Fin de semana - sin horarios por defecto
              return {
                ...response,
                data: [],
              };
            }
          }
          return response;
        }),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Obtener horarios disponibles');
          return throwError(() => error);
        })
      );
  }

  // getHorariosDisponibles(espacioId: number, fecha: string): Observable<DataResponseDTO<string[]>> {
  //   return this.tieneBloqueos(espacioId, fecha).pipe(
  //     switchMap((bloqueosResponse) => {
  //       // Si hay bloqueos, no hay horarios disponibles
  //       if (bloqueosResponse.data) {
  //         return of({ status: 'success', data: [] } as DataResponseDTO<string[]>);
  //       }

  //       // Si no hay bloqueos, obtener horarios normales
  //       return this.http
  //         .get<DataResponseDTO<string[]>>(
  //           `${API_BASE}/configuracion-horarios/horarios-disponibles`,
  //           {
  //             params: { espacioId: espacioId.toString(), fecha },
  //           }
  //         )
  //         .pipe(
  //           map((response) => {
  //             // Si no hay horarios configurados, usar horarios por defecto
  //             if (!response.data || response.data.length === 0) {
  //               const date = new Date(fecha);
  //               return {
  //                 ...response,
  //                 data: this.generateDefaultTimeSlots(date),
  //               };
  //             }
  //             return response;
  //           })
  //         );
  //     }),
  //     catchError((error) => {
  //       this.errorHandler.handleHttpError(error, 'Obtener horarios disponibles');
  //       return throwError(() => error);
  //     })
  //   );
  // }

  /**
   * Verificar si un día tiene configuración especial
   */
  tieneConfiguracionEspecial(
    espacioId: number,
    fecha: string
  ): Observable<DataResponseDTO<boolean>> {
    return this.http
      .get<DataResponseDTO<boolean>>(`${API_BASE}/configuracion-horarios/configuracion-especial`, {
        params: { espacioId: espacioId.toString(), fecha },
      })
      .pipe(
        catchError((error) => {
          // Si el endpoint no existe, asumir que no hay configuración especial
          console.warn(
            'Endpoint de configuración especial no disponible, usando valor por defecto'
          );
          return of({ status: 'success', data: false } as DataResponseDTO<boolean>);
        })
      );
  }

  /**
   * Verificar disponibilidad de un horario específico
   */
  verificarDisponibilidad(
    espacioId: number,
    fecha: string,
    horaInicio: string,
    horaFin: string
  ): Observable<DataResponseDTO<boolean>> {
    return this.http
      .get<DataResponseDTO<boolean>>(`${API_BASE}/configuracion-horarios/disponibilidad`, {
        params: {
          espacioId: espacioId.toString(),
          fecha,
          horaInicio,
          horaFin,
        },
      })
      .pipe(
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Verificar disponibilidad');
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener citas por paciente (para el usuario actual)
   */
  getMisCitas(pacienteId: number, estado?: string): Observable<DataResponseDTO<CitaDTO[]>> {
    let params = new HttpParams().set('pacienteId', pacienteId.toString());
    if (estado) params = params.set('estado', estado);

    return this.http.get<DataResponseDTO<CitaDTO[]>>(`${API_BASE}/citas`, { params }).pipe(
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Obtener mis citas');
        return throwError(() => error);
      })
    );
  }

  /**
   * Mapear CitaDTO a AppointmentSlot
   */
  mapToAppointmentSlot(dto: CitaDTO): AppointmentSlot {
    const fecha = new Date(dto.fecha);
    const horaInicio = this.formatTime(fecha);
    const horaFin = this.calculateEndTime(fecha, dto.duracion);

    const appointmentSlot: AppointmentSlot = {
      citaId: dto.ticketId,
      id: String(dto.ticketId),
      fecha: fecha,
      horaInicio: horaInicio,
      horaFin: horaFin,
      cubiculoId: String(dto.espacioId),
      espacioNombre: dto.espacioNombre,
      pacienteNombre: dto.pacienteNombre,
      pacienteId: Number(dto.pacienteId),
      terapeutaId: Number(dto.terapeutaId),
      terapeutaNombre: dto.terapeutaNombre,
      estado: this.mapEstadoCita(dto.estadoTicket) as any,
      notas: dto.notas,
      modalidad: dto.modalidad,
      materia: dto.materia,
    };
    
    console.log('🎯 AppointmentSlot mapeado:', appointmentSlot);
    return appointmentSlot;
  }

  /**
   * Mapear datos de la API a Cubiculo
   */
  mapToCubiculo(dto: EspacioDTO): Cubiculo {
    return {
      id: String(dto.espacioId),
      nombre: dto.nombre,
      disponible: dto.estaActivo,
      // disponible: dto.estaActivo, //Hay que agregar un && para validar tambien si la hora esta disponible
      costoPorHora: dto.costoPorHora,
    };
  }

  /**
   * Calcular hora de fin basado en fecha de inicio y duración
   */
  private calculateEndTime(startDate: Date, duration: number): string {
    const endDate = new Date(startDate.getTime() + duration * 60000); // Convertir minutos a milisegundos
    return this.formatTime(endDate);
  }

  /**
   * Formatear fecha a string HH:mm
   */
  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Convertir hora string a minutos desde medianoche
   */
  timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Calcular duración en minutos entre dos horas
   */
  calculateDuration(horaInicio: string, horaFin: string): number {
    const startMinutes = this.timeToMinutes(horaInicio);
    const endMinutes = this.timeToMinutes(horaFin);
    return endMinutes - startMinutes;
  }

  /**
   * Verificar si una fecha tiene bloqueos
   */
  tieneBloqueos(espacioId: number, fecha: string): Observable<DataResponseDTO<boolean>> {
    return this.http
      .get<DataResponseDTO<boolean>>(`${API_BASE}/bloqueos-horarios/disponibilidad`, {
        params: {
          espacioId: espacioId.toString(),
          fechaHora: `${fecha}T00:00:00`, // Inicio del día
        },
      })
      .pipe(
        map((response) => ({
          ...response,
          data: !response.data, // Invertir: si está disponible = no tiene bloqueos
        })),
        catchError((error) => {
          console.warn('Error verificando bloqueos, asumiendo sin bloqueos');
          return of({ status: 'success', data: false } as DataResponseDTO<boolean>);
        })
      );
  }

  private mapEstadoCita(estado: string): 'AGENDADO' | 'COMPLETADO' | 'CANCELADO' | 'BORRADOR' | 'EN_PROGRESO' {
    const estadoMap: Record<string, any> = {
      BORRADOR: 'BORRADOR',
      AGENDADO: 'AGENDADO',
      EN_PROGRESO: 'EN_PROGRESO',
      COMPLETADO: 'COMPLETADO',
      CANCELADO: 'CANCELADO',
    };
    return estadoMap[estado] || 'BORRADOR';
  }

  private mapEstadoToAPI(estado: string): string {
    const estadoMap: Record<string, string> = {
      BORRADOR: 'BORRADOR',
      AGENDADO: 'AGENDADO',
      EN_PROGRESO: 'EN_PROGRESO',
      COMPLETADO: 'COMPLETADO',
      CANCELADO: 'CANCELADO',
    };
    return estadoMap[estado] || 'BORRADOR';
  }

  private mapTicketToCitaDTO(ticket: any): CitaDTO | null {
    // El backend retorna TicketFiltroDTO con estructura simplificada
    // Campos disponibles: ticketId, folio, pacienteNombre, terapeutaNombre, 
    // fechaInicioCita, estadoTicket, etc.
    
    // ⭐ Validaciones críticas
    if (!ticket || !ticket.pacienteNombre) {
      console.warn('⚠️ Ticket sin pacienteNombre:', ticket);
      return null;
    }

    // Buscar fecha en diferentes lugares
    let citaFecha = null;
    if (ticket.fechaInicioCita) {
      citaFecha = new Date(ticket.fechaInicioCita);
      console.log('📅 Usando fechaInicioCita:', ticket.fechaInicioCita);
    } else if (ticket.fecha) {
      citaFecha = new Date(ticket.fecha);
      console.log('📅 Usando fecha:', ticket.fecha);
    } else if (ticket.fechaCreacion) {
      citaFecha = new Date(ticket.fechaCreacion);
      console.log('📅 Usando fechaCreacion como fallback:', ticket.fechaCreacion);
    } else {
      console.warn('⚠️ Ticket sin fecha válida:', ticket.ticketId);
      return null;
    }

    // ⭐ CRÍTICO: Si no hay espacioId, no se puede mostrar en calendario
    if (!ticket.espacioId || ticket.espacioId === 0) {
      console.warn('⚠️ Ticket sin espacioId:', ticket.ticketId, '- No se mostrará en calendario');
      return null;
    }

    const citaDTO: CitaDTO = {
      ticketId: ticket.ticketId || 0,
      espacioId: ticket.espacioId || 0,
      espacioNombre: ticket.espacioNombre || 'Cubículo sin nombre',
      fecha: citaFecha,
      duracion: ticket.duracion || 60, // Duración por defecto en minutos
      pacienteId: ticket.pacienteId || 0,
      pacienteNombre: ticket.pacienteNombre || 'Sin paciente',
      terapeutaId: ticket.terapeutaId || 0,
      terapeutaNombre: ticket.terapeutaNombre || 'Sin terapeuta',
      materia: ticket.materia || '',
      modalidad: ticket.modalidad || 'Presencial',
      estadoTicket: ticket.estadoTicket || 'BORRADOR',
      notas: ticket.notas || '',
      fechaCreacion: ticket.fechaCreacion ? new Date(ticket.fechaCreacion) : new Date(),
    };
    
    console.log('✅ CitaDTO mapeada exitosamente:', citaDTO);
    return citaDTO;
  }

  /**
   * Obtener cita por ID
   */
  obtenerCitaPorId(citaId: number): Observable<DataResponseDTO<CitaDTO>> {
    return this.http.get<DataResponseDTO<CitaDTO>>(`${API_BASE}/citas/${citaId}`).pipe(
      tap(() => console.log('Cita obtenida')),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Obtener cita');
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener citas por terapeuta
   */
  obtenerCitasPorTerapeuta(terapeutaId: number): Observable<DataResponseDTO<CitaDTO[]>> {
    return this.http.get<DataResponseDTO<CitaDTO[]>>(`${API_BASE}/citas/terapeuta/${terapeutaId}`).pipe(
      tap(() => console.log('Citas del terapeuta obtenidas')),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Obtener citas del terapeuta');
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener citas por paciente
   */
  obtenerCitasPorPaciente(pacienteId: number): Observable<DataResponseDTO<CitaDTO[]>> {
    return this.http.get<DataResponseDTO<CitaDTO[]>>(`${API_BASE}/citas/paciente/${pacienteId}`).pipe(
      tap(() => console.log('Citas del paciente obtenidas')),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Obtener citas del paciente');
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener slots de tiempo disponibles para un espacio y fecha específicos
   */
  getSlotsDisponibles(espacioId: number, fecha: string): Observable<DataResponseDTO<any>> {
    let params = new HttpParams()
      .set('espacioId', espacioId.toString())
      .set('fecha', fecha);

    return this.http.get<DataResponseDTO<any>>(`${API_BASE}/configuracion-horarios/slots-disponibles`, { params }).pipe(
      tap(() => console.log('Slots disponibles obtenidos')),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Obtener slots disponibles');
        return throwError(() => error);
      })
    );
  }

  /**
   * Generar horarios por defecto (7:00 - 18:00)
   */
  private generateDefaultTimeSlots(): string[] {
    const slots: string[] = [];
    for (let h = 7; h <= 17; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00-${(h + 1).toString().padStart(2, '0')}:00`);
    }
    return slots;
  }
}
