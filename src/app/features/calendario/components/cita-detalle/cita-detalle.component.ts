import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CalendarService } from '../../../../core/services/calendar.service';
import { DateUtilService } from '../../../../core/services/date-util.service';

/**
 * Componente para ver detalles completos de una cita (ticket/appointment)
 * Muestra información del paciente, terapeuta, creador, montos, notas, etc.
 */
@Component({
  selector: 'app-cita-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cita-detalle.component.html',
  styleUrls: ['./cita-detalle.component.css'],
})
export class CitaDetalleComponent implements OnInit {
  private calendarService = inject(CalendarService);
  private dateUtilService = inject(DateUtilService);
  private route = inject(ActivatedRoute);

  // Estado
  isLoading = signal(false);
  error = signal<string | null>(null);
  cita = signal<any>(null);

  // Computed: formatos para mostrar
  citaFormato = computed(() => {
    const c = this.cita();
    if (!c) return null;

    return {
      ...c,
      fechaFormato: this.dateUtilService.formatDisplayDateTime(new Date(c.fecha)),
      costoTotalFormato: `$${c.costoTotal?.toFixed(2) || '0.00'}`,
      costoEspacioFormato: `$${c.costoEspacio?.toFixed(2) || '0.00'}`,
      costoMaterialesFormato: `$${c.costoMateriales?.toFixed(2) || '0.00'}`,
      costoAdicionalFormato: `$${c.costoAdicional?.toFixed(2) || '0.00'}`,
      montoPagadoFormato: `$${c.montoPagado?.toFixed(2) || '0.00'}`,
    };
  });

  ngOnInit(): void {
    this.cargarCita();
  }

  /**
   * Carga los detalles de la cita desde la API
   */
  cargarCita(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const citaId = this.route.snapshot.paramMap.get('id');
    if (!citaId) {
      this.error.set('ID de cita no encontrado');
      this.isLoading.set(false);
      return;
    }

    this.calendarService.obtenerCitaPorId(Number(citaId)).subscribe({
      next: (response) => {
        this.cita.set(response.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Error al cargar cita:', err);
        this.error.set('Error al cargar los detalles de la cita');
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Vuelve a la página anterior
   */
  volver(): void {
    window.history.back();
  }

  /**
   * Copia texto al portapapeles
   */
  copiarAlPortapapeles(texto: string | number): void {
    navigator.clipboard.writeText(String(texto)).then(() => {
      alert('✅ Copiado al portapapeles');
    });
  }
}
