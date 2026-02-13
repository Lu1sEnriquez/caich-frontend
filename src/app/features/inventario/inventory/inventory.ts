import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { of, Observable } from 'rxjs';

import { InventoryService } from '../../../core/services/inventory.service';
import { Producto } from '../../../core/models/api-models';
import { CardComponent } from '../../../shared/components/ui/card/card.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { InputComponent } from '../../../shared/components/ui/input/input.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { ProductoModalComponent } from '../producto-modal/producto-modal.component';
import { PaginatorModule } from 'primeng/paginator'; 
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';



@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ButtonComponent,
    InputComponent,
    BadgeComponent,
    ProductoModalComponent,
    PaginatorModule,
    FormsModule, // <--- 2. Agregar esto aquí
    CheckboxModule
  ],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Inventory implements OnInit, AfterViewInit {
  private inventoryService = inject(InventoryService);

  @ViewChild(ProductoModalComponent, { static: false }) productoModal!: ProductoModalComponent;

  // Estado del modal
  modalVisible = signal(false);
  
  // Estado de búsqueda
  searchQuery = signal('');

  // Paginación
  currentPage = signal(0);
  pageSize = signal(10);
  
  // Trigger para cargar productos
  productsTrigger = signal(1);

 // Nuevos Signals de Filtro
selectedCategoria = signal('');
filterActivo = signal<boolean | undefined>(undefined);
filterPrestable = signal<boolean | undefined>(undefined);
filterVendible = signal<boolean | undefined>(undefined);



// Actualización del rxResource
productsResource = rxResource({
  params: () => ({
    trigger: this.productsTrigger(),
    search: this.searchQuery(),
    page: this.currentPage(),
    size: this.pageSize(),
    categoria: this.selectedCategoria(),
    activo: this.filterActivo(),
    prestable: this.filterPrestable(),
    vendible: this.filterVendible(),
  }),
  stream: ({ params }) => {
    if (params.trigger === 0) return of(null);
    return this.inventoryService.getAllProductsPaginable(
      params.page,
      params.size,
      {
        nombre: params.search,
        categoria: params.categoria,
        estaActivo: params.activo,
        esPrestable: params.prestable,
        esVendible: params.vendible
      }
    );
  },
});
  // Lista de productos - extrae correctamente del response paginado
  products = computed(() => {
    const response = this.productsResource.value();
    if (!response || !response.data) return [];
    
    // Si data es un array, retornarlo directamente
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    // Si data es un objeto con propiedad 'content' (formato paginado)
    if (response.data.content && Array.isArray(response.data.content)) {
      return response.data.content;
    }
    
    return [];
  });

  // Productos filtrados por búsqueda (en el cliente)
  filteredProducts = computed(() => {
    const search = this.searchQuery().toLowerCase();
    if (!search) return this.products();
    return this.products().filter(
      (p: Producto) =>
        p.nombre?.toLowerCase().includes(search) ||
        p.codigo?.toLowerCase().includes(search) ||
        p.categoria?.toLowerCase().includes(search)
    );
  });

  /**
 * Resetea todos los filtros a su estado inicial
 */
resetFilters(): void {
  this.searchQuery.set('');
  this.selectedCategoria.set('');
  this.filterActivo.set(undefined);
  this.filterPrestable.set(undefined);
  this.filterVendible.set(undefined);
  this.currentPage.set(0);
}

  // Estadísticas
  stats = computed(() => {
    const prods = this.products();
    const arr = Array.isArray(prods) ? prods : [];
    return {
      total: arr.length,
      conStock: arr.filter((p) => (p.stock ?? 0) > 0).length,
      sinStock: arr.filter((p) => (p.stock ?? 0) === 0).length,
    };
  });

  ngOnInit(): void {
    // Component lifecycle hook - products se cargan automáticamente via rxResource
  }

  ngAfterViewInit(): void {
    // Componente modal está disponible después de la primera renderización
  }

  /**
   * Abre el modal para crear un nuevo producto
   */
  openNew(): void {
    if (this.productoModal) {
      this.productoModal.openNew();
    }
  }

  /**
   * Abre el modal para editar un producto existente
   */
  editProduct(product: Producto): void {
    if (this.productoModal) {
      this.productoModal.editProduct(product);
    }
  }

  /**
   * Maneja la actualización después de guardar un producto
   */
  onProductSaved(): void {
    this.productsTrigger.update((v) => v + 1);
  }

  /**
   * Elimina un producto
   */
  deactivateProduct(product: Producto): void {
    if (!confirm(`¿Deseas desactivar el producto "${product.nombre}"?`)) {
      return;
    }

    this.inventoryService.deactivateProduct(product.productoId!).subscribe({
      next: () => {
        this.productsTrigger.update((v) => v + 1);
      },
      error: (err) => {
        console.error('Error al desactivar producto:', err);
      },
    });
  }

  /**
   * Obtiene el color del badge según la disponibilidad
   */
  getStockBadgeVariant(stock: number | undefined): 'success' | 'warning' | 'danger' {
    if (!stock || stock === 0) return 'danger';
    if (stock >= 10) return 'success';
    return 'warning';
  }

  // Necesitamos el total de elementos para que el paginador sepa cuántas páginas hay
  totalRecords = computed(() => {
    const response = this.productsResource.value();
    if (!response || !response.data) return 0;
    // Extraemos el totalElements del formato Page de Spring
    return response.data.totalElements || 0;
  });

  /**
   * Maneja el cambio de página desde el componente PrimeNG
   */
  onPageChange(event: any): void {
    this.currentPage.set(event.page);
    this.pageSize.set(event.rows);
    // El rxResource se disparará automáticamente al cambiar estos signals
  }
}
