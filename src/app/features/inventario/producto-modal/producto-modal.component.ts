import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';

import { InventoryService } from '../../../core/services/inventory.service';
import { ActualizarProductoRequest, CrearProductoRequest, Producto } from '../../../core/models/api-models';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { InputComponent } from '../../../shared/components/ui/input/input.component';
import { CheckboxModule } from 'primeng/checkbox';
@Component({
  selector: 'app-producto-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonComponent,
    InputComponent,
    CheckboxModule, // <--- Agrega esto
  ],
  templateUrl: './producto-modal.component.html',
  styleUrl: './producto-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductoModalComponent {
  private fb = inject(FormBuilder);
  private inventoryService = inject(InventoryService);

  visible = signal(false);
  product: Producto | null = null;

  @Output() productSaved = new EventEmitter<void>();

  productForm!: FormGroup;

  constructor() {
    this.initializeForm();
  }

  /**
   * Inicializa el formulario con los validadores requeridos
   */
  private initializeForm(): void {
    this.productForm = this.fb.group({
      codigo: ['', [Validators.required]],
      nombre: ['', [Validators.required]],
      descripcion: [''],
      categoria: ['', [Validators.required]],
      precio: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      stockMinimo: [0, [Validators.required, Validators.min(0)]],
      esVendible: [false],
      esPrestable: [false],
    });
  }

  categorias = [
  { label: 'Material', value: 'Material' },
  { label: 'Libro', value: 'Libro' },
  { label: 'Test', value: 'Test' },
  { label: 'Equipo', value: 'Equipo' },
  { label: 'Otro', value: 'Otro' }
];
  /**
   * Abre el modal para crear un nuevo producto
   */
  openNew(): void {
    this.product = null;
    this.productForm.reset();
    this.visible.set(true);
  }

  /**
   * Abre el modal para editar un producto existente
   */
  editProduct(product: Producto): void {
    this.product = product;
    this.productForm.patchValue({
      codigo: product.codigo,
      nombre: product.nombre,
      descripcion: product.descripcion,
      categoria: product.categoria,
      precio: product.precio,
      stock: product.stock,
      stockMinimo: product.stockMinimo,
      esVendible: product.esVendible,
      esPrestable: product.esPrestable,
    });
    this.visible.set(true);
  }

  /**
   * Guarda el producto (crear o actualizar) y cierra el modal
   */
  saveProduct(): void {
  if (this.productForm.invalid) {
    this.productForm.markAllAsTouched();
    return;
  }

  // 1. Obtenemos los valores del formulario
  const formValue = this.productForm.getRawValue();

  // 2. Mapeo y casting manual para asegurar integridad
  const dataPayload: ActualizarProductoRequest = {
    ...this.product, // Mantenemos ID y otros campos si es edición
    codigo: formValue.codigo,
    nombre: formValue.nombre,
    descripcion: formValue.descripcion || '',
    categoria: formValue.categoria,
    precio: Number(formValue.precio),
    stock: Number(formValue.stock),
    stockMinimo: Number(formValue.stockMinimo),
    esVendible: !!formValue.esVendible,
    esPrestable: !!formValue.esPrestable,
    estaActivo: this.product ? this.product.estaActivo : true
  };

  console.log('Payload final a enviar:', dataPayload);

  if (this.product && this.product.productoId) {
    // ACTUALIZAR
    this.inventoryService.updateProduct(this.product.productoId, dataPayload).subscribe({
      next: () => this.handleSuccess(),
      error: (err) => console.error('Error Update:', err)
    });
  } else {
    // CREAR
    this.inventoryService.createProduct(dataPayload as CrearProductoRequest).subscribe({
      next: () => this.handleSuccess(),
      error: (err) => console.error('Error Create:', err)
    });
  }
}

private handleSuccess(): void {
  this.hideDialog();
  this.productSaved.emit();
}

  /**
   * Cierra el modal y limpia el formulario
   */
  hideDialog(): void {
    this.visible.set(false);
    this.product = null;
    this.productForm.reset();
  }
}
