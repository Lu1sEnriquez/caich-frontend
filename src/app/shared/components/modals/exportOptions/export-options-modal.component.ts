import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../ui/button/button.component';

@Component({
  selector: 'app-export-options-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './export-options-modal.component.html',
  styleUrls: ['./export-options-modal.component.css'],
})
export class ExportOptionsModalComponent {
  availableFields = input.required<string[]>();

  // Señal interna para manejar selecciones
  selectedFields = signal<string[]>([]);

  confirm = output<string[]>();
  cancel = output<void>();

  constructor() {
    // Inicializar con todos los campos seleccionados por defecto al cargar
    // (Esto requiere un efecto o lógica en ngOnInit si availableFields cambia dinámicamente,
    // pero para este caso simple lo manejaremos en el toggle inicial)
  }

  ngOnInit() {
    this.selectedFields.set([...this.availableFields()]);
  }

  isFieldSelected(field: string): boolean {
    return this.selectedFields().includes(field);
  }

  toggleField(field: string) {
    this.selectedFields.update((fields) => {
      if (fields.includes(field)) {
        return fields.filter((f) => f !== field);
      } else {
        return [...fields, field];
      }
    });
  }

  confirmExport() {
    this.confirm.emit(this.selectedFields());
  }
}
