import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../ui/button/button.component';

export interface ExportOptions {
  fields: string[];
  roles: string[];
}

@Component({
  selector: 'app-export-options-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './export-options-modal.component.html',
  styleUrls: ['./export-options-modal.component.css'],
})
export class ExportOptionsModalComponent {
  availableFields = input.required<string[]>();
  availableRoles = input<string[]>([]);

  // Señales internas para manejar selecciones
  selectedFields = signal<string[]>([]);
  selectedRoles = signal<string[]>([]);

  confirm = output<ExportOptions>();
  cancel = output<void>();

  ngOnInit() {
    this.selectedFields.set([...this.availableFields()]);
    this.selectedRoles.set([...this.availableRoles()]);
  }

  isFieldSelected(field: string): boolean {
    return this.selectedFields().includes(field);
  }

  isRoleSelected(role: string): boolean {
    return this.selectedRoles().includes(role);
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

  toggleRole(role: string) {
    this.selectedRoles.update((roles) => {
      if (roles.includes(role)) {
        return roles.filter((r) => r !== role);
      } else {
        return [...roles, role];
      }
    });
  }

  selectAllRoles() {
    this.selectedRoles.set([...this.availableRoles()]);
  }

  deselectAllRoles() {
    this.selectedRoles.set([]);
  }

  selectAllFields() {
    this.selectedFields.set([...this.availableFields()]);
  }

  deselectAllFields() {
    this.selectedFields.set([]);
  }

  confirmExport() {
    this.confirm.emit({
      fields: this.selectedFields(),
      roles: this.selectedRoles(),
    });
  }
}
