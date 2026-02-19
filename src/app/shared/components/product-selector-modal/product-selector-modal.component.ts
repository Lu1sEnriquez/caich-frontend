import { Component, signal, computed, input, output, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../../core/services/inventory.service';
import { rxResource } from '@angular/core/rxjs-interop';

export interface ProductoSeleccionado {
  id: string;
  nombre: string;
  costoUnitario: number;
  tipo: 'Producto' | 'Servicio';
  esPrestable?: boolean;
  esVendible?: boolean;
  stock?: number;
  tipoAccion?: 'Venta' | 'Prestamo';
}

@Component({
  selector: 'app-product-selector-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-selector-modal.component.html',
  styleUrl: './product-selector-modal.component.css'
})
export class ProductSelectorModalComponent {
  isOpen = input(false);
  onClose = output<void>();
  onProductSelect = output<ProductoSeleccionado>();

  searchTerm = signal('');
  selectedProducts = signal<ProductoSeleccionado[]>([]);
  currentPage = signal(0);
  pageSize = signal(10);

  private inventoryService = inject(InventoryService);

  // Resource para cargar productos con paginación
  productosResource = rxResource({
    params: () => ({
      page: this.currentPage(),
      size: this.pageSize()
    }),
    stream: ({ params }) =>
      this.inventoryService.getAllProductsPaginable(params.page, params.size)
  });

  // Computed para productos disponibles
  productosDisponibles = computed(() => {
    const response = this.productosResource.value() as any;
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

  // Total de elementos
  totalElements = computed(() => {
    const response = this.productosResource.value() as any;
    if (!response?.data?.totalElements) return 0;
    return response.data.totalElements;
  });

  // Total de páginas
  totalPages = computed(() => {
    const total = this.totalElements();
    const size = this.pageSize();
    return Math.ceil(total / size);
  });

  // Computed para filtrar solo productos vendibles y prestables según necesidad
  productosFiltered = computed(() => {
    const productos = this.productosDisponibles();
    const search = this.searchTerm().toLowerCase();

    if (!search) return productos;

    return productos.filter((p: any) =>
      p.nombre.toLowerCase().includes(search) ||
      p.codigo?.toLowerCase().includes(search) ||
      p.categoria?.toLowerCase().includes(search)
    );
  });

  constructor() {
    // Cargar productos al abrir el modal
    effect(() => {
      if (this.isOpen()) {
        this.currentPage.set(0);
        this.productosResource.reload();
      }
    });
  }

  selectProduct(producto: any, tipoAccion: 'Venta' | 'Prestamo'): void {
    const productoSeleccionado: ProductoSeleccionado = {
      id: producto.productoId || producto.id,
      nombre: producto.nombre,
      costoUnitario: producto.precio || producto.costoUnitario || 0,
      tipo: producto.categoria || 'Producto',
      esPrestable: producto.esPrestable,
      esVendible: producto.esVendible,
      stock: producto.stock,
      tipoAccion
    };

    this.selectedProducts.update(productos => [...productos, productoSeleccionado]);
  }

  confirmSelection(): void {
    // Emitir todos los productos seleccionados
    this.selectedProducts().forEach(producto => {
      this.onProductSelect.emit(producto);
    });
    // Cerrar el modal después de confirmar
    this.close();
  }

  removeSelectedProduct(index: number): void {
    this.selectedProducts.update(productos =>
      productos.filter((_, i) => i !== index)
    );
  }

  close(): void {
    this.searchTerm.set('');
    this.selectedProducts.set([]);
    this.onClose.emit();
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  get modalOpen(): boolean {
    return this.isOpen();
  }

  get hasSelectedProducts(): boolean {
    return this.selectedProducts().length > 0;
  }

  getSelectedProductsCount(): number {
    return this.selectedProducts().length;
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update(p => p + 1);
      this.productosResource.reload();
    }
  }

  previousPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
      this.productosResource.reload();
    }
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.productosResource.reload();
    }
  }

  get canNextPage(): boolean {
    return this.currentPage() < this.totalPages() - 1;
  }

  get canPreviousPage(): boolean {
    return this.currentPage() > 0;
  }
}
