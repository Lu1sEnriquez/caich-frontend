import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { SpacesService, CrearEspacioDTO, EspacioDTO, EspaciosListResponse, EspacioResponse } from '../../../../core/services/spaces.service';
import { CardComponent } from '../../../../shared/components/ui/card';
import { BadgeComponent } from '../../../../shared/components/ui/badge/badge.component';
import { formatDisplayDate } from '../../../../core/utils';

@Component({
  selector: 'app-spaces-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardComponent,
    BadgeComponent,
  ],
  templateUrl: './spaces-management.component.html',
  styleUrls: ['./spaces-management.component.css'],
})
export class SpacesManagementComponent {
  private spacesService = inject(SpacesService);
  private fb = inject(FormBuilder);

  private spacesTrigger = signal(1);

  // Modal
  showModal = signal(false);
  isEditing = signal(false);
  currentEditId = signal<number | null>(null);

  // Form
  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    descripcion: [''],
    capacidad: [1, [Validators.required, Validators.min(1)]],
    costoPorHora: [0, [Validators.required, Validators.min(0)]],
    estaActivo: [true],
  });

  // Obtener espacios
  spacesResource = rxResource({
    params: () => ({ trigger: this.spacesTrigger() }),
    stream: ({ params }) => {
      if (params.trigger === 0) return of(null);
      return this.spacesService.getAll().pipe(
        catchError((error) => {
          console.error('Error cargando espacios:', error);
          return of(null);
        })
      );
    },
  });

  // Computed
  spaces = computed<EspacioDTO[]>(() => this.spacesResource.value()?.data || []);

  openModal() {
    this.showModal.set(true);
    this.isEditing.set(false);
    this.currentEditId.set(null);
    this.form.reset({ estaActivo: true });
  }

  closeModal() {
    this.showModal.set(false);
    this.form.reset();
  }

  editSpace(space: EspacioDTO) {
    this.isEditing.set(true);
    this.currentEditId.set(space.espacioId!);
    this.form.patchValue(space);
    this.showModal.set(true);
  }

  saveSpace() {
    if (this.form.invalid) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    const formValue = this.form.value;
    const dto: CrearEspacioDTO = {
      nombre: formValue.nombre!,
      descripcion: formValue.descripcion || '',
      capacidad: formValue.capacidad!,
      costoPorHora: formValue.costoPorHora!,
      estaActivo: formValue.estaActivo ?? true,
    };

    const operation = this.isEditing()
      ? this.spacesService.update(this.currentEditId()!, dto)
      : this.spacesService.create(dto);

    operation.subscribe({
      next: () => {
        alert(
          `Espacio ${this.isEditing() ? 'actualizado' : 'creado'} exitosamente`
        );
        this.spacesTrigger.update((v) => v + 1);
        this.closeModal();
      },
      error: (error) => {
        console.error('Error:', error);
        alert(`Error: ${error.error?.message || 'Error desconocido'}`);
      },
    });
  }

  deleteSpace(space: EspacioDTO) {
    const confirm = window.confirm(
      `¿Estás seguro de que deseas eliminar el espacio "${space.nombre}"?`
    );
    if (!confirm) return;

    this.spacesService.delete(space.espacioId!).subscribe({
      next: () => {
        alert('Espacio eliminado exitosamente');
        this.spacesTrigger.update((v) => v + 1);
      },
      error: (error) => {
        console.error('Error:', error);
        alert(`Error: ${error.error?.message || 'No se puede eliminar este espacio'}`);
      },
    });
  }

  toggleStatus(space: EspacioDTO) {
    const newStatus = !space.estaActivo;
    this.spacesService.changeStatus(space.espacioId!, newStatus).subscribe({
      next: () => {
        alert(`Estado actualizado a ${newStatus ? 'Activo' : 'Inactivo'}`);
        this.spacesTrigger.update((v) => v + 1);
      },
      error: (error) => {
        console.error('Error:', error);
        alert(`Error: ${error.error?.message || 'Error desconocido'}`);
      },
    });
  }

  getStatusBadgeClass(space: EspacioDTO): string {
    return space.estaActivo
      ? 'px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm'
      : 'px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm';
  }

  formatCost(cost: number): string {
    return `$${cost.toFixed(2)}`;
  }
}
