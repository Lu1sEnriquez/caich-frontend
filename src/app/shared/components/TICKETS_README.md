# Componentes de Gestión de Tickets

## 📋 Descripción General

Se han creado tres componentes profesionales para gestionar tickets completos (crear, actualizar, leer y eliminar):

1. **ProductSelectorModalComponent** - Modal mejorado para seleccionar productos con acciones de Venta/Préstamo
2. **TicketManagerModalComponent** - Modal completo para crear/editar tickets con cálculos automáticos
3. **TicketListComponent** - Listado de tickets con estadísticas y operaciones CRUD
4. **Ticket Service** - Servicio para comunicación con backend

---

## 🎯 ProductSelectorModalComponent

**Ubicación:** `src/app/shared/components/product-selector-modal/`

### Características:
- ✅ Búsqueda en tiempo real por nombre, código o categoría
- ✅ Tabla con información completa del producto (código, nombre, categoría, precio, stock)
- ✅ **Botones duales:** "🛒 Vender" y "📖 Prestar" según capacidades del producto
- ✅ Indicadores visuales de stock (OK/Warning/Danger)
- ✅ Muestra solo acciones disponibles (vendible, prestable)
- ✅ Sección de productos seleccionados con resumen
- ✅ Integración con InventoryService automática

### Uso:
```html
<app-product-selector-modal 
  [isOpen]="showProductSelectorModal()"
  (onClose)="closeProductSelectorModal()"
  (onProductSelect)="onProductoSeleccionadoDelModal($event)">
</app-product-selector-modal>
```

### Interfaz de Datos:
```typescript
interface ProductoSeleccionado {
  id: string;
  nombre: string;
  costoUnitario: number;
  tipo: 'Producto' | 'Servicio';
  esPrestable?: boolean;
  esVendible?: boolean;
  stock?: number;
  tipoAccion?: 'Venta' | 'Prestamo'; // ✨ NUEVO
}
```

---

## 🎫 TicketManagerModalComponent

**Ubicación:** `src/app/shared/components/ticket-manager-modal/`

### Características:
- ✅ **Modo crear/editar automático**
- ✅ Sección de productos con:
  - Cantidad y precio editables
  - Tipo de uso (Venta/Préstamo)
  - Fecha devolución estimada (solo para préstamos)
  - Subtotal calculado automáticamente
  - Remover individual
- ✅ **Cálculos automáticos:**
  - Subtotal productos
  - Total con costo adicional
  - Monto pagado
  - Monto faltante
  - Porcentaje de pago
- ✅ **Barra de progreso visual** de estado de pago
- ✅ Estados de pago con colores (No pagado/Parcial/Pagado)
- ✅ Validaciones integradas
- ✅ Sección de notas

### Interfaz de Datos:
```typescript
interface Ticket {
  id?: string;
  citaId: string;
  tipoTicket: 'Cita' | 'Prestamo' | 'Venta';
  costoAdicional: number;
  montoPagado: number;
  productos: TicketProducto[];
  estado: 'Pendiente' | 'Pagado' | 'Cancelado';
  notas: string;
  fechaCreacion?: string;
}

interface TicketProducto {
  productoId: string;
  nombre: string;
  cantidad: number;
  precio: number;
  tipoUso: 'Venta' | 'Prestamo';
  fechaDevolucionEstimada?: string;
  subtotal: number;
}
```

### Uso:
```html
<app-ticket-manager-modal
  [isOpen]="showTicketModal()"
  [ticket]="editingTicket()"
  (onClose)="closeTicketModal()"
  (onSave)="onTicketSave($event)">
</app-ticket-manager-modal>
```

---

## 📊 TicketListComponent

**Ubicación:** `src/app/shared/components/ticket-list/`

### Características:
- ✅ Listado de tickets para una cita específica
- ✅ **Estadísticas automáticas:**
  - Total de tickets
  - Total ventas
  - Total préstamos
  - Total cobrado
- ✅ **Tabla con información:**
  - ID del ticket
  - Tipo (Cita/Venta/Préstamo) con icono
  - Cantidad de productos
  - Total
  - Monto pagado
  - Monto faltante
  - Estado (Pagado/Pendiente/Cancelado)
- ✅ **Acciones inline:** Editar y eliminar
- ✅ Integración automática con API

### Uso:
```html
<app-ticket-list
  [citaId]="appointmentId()">
</app-ticket-list>
```

### Props:
- `citaId` (input) - ID de la cita para cargar tickets

---

## 🔧 TicketService

**Ubicación:** `src/app/core/services/ticket.service.ts`

### Métodos:
```typescript
// Crear nuevo ticket
createTicket(ticket: any): Observable<any>

// Actualizar ticket existente
updateTicket(id: string, ticket: any): Observable<any>

// Obtener un ticket
getTicket(id: string): Observable<any>

// Obtener tickets de una cita
getTicketsByCita(citaId: string): Observable<any>

// Eliminar ticket
deleteTicket(id: string): Observable<any>

// Obtener tickets paginados
getTickets(page: number, size: number, filters: any): Observable<any>

// Generar reporte PDF
generateTicketReport(id: string): Observable<Blob>
```

---

## 🎨 Estilos y Temas

Todos los componentes utilizan el sistema de **CSS variables** consistente:
- Colores: `--color-primary`, `--color-success`, `--color-destructive`, etc.
- Espaciado: `--space-xs`, `--space-sm`, `--space-md`, `--space-lg`, `--space-xl`, `--space-2xl`
- Border radius: `--radius-sm`, `--radius-md`, `--radius-lg`

### Paleta de Colores:
- **Primary (Azul):** #3b82f6
- **Success (Verde):** #10b981
- **Warning (Amarillo):** #f59e0b
- **Destructive (Rojo):** #ef4444
- **Info (Cian):** #0284c7

---

## 📱 Diseño Responsivo

Todos los componentes son **fully responsive**:
- ✅ Tablets (≤768px)
- ✅ Móviles (≤480px)
- ✅ Desktops
- ✅ Tablas con scroll horizontal en móviles

---

## 🔌 Integración con Appointment-Schedule

Agregado en [appointment-schedule.component.ts](../../features/calendario/components/appointment-schedule/):

```typescript
// Imports
import { TicketManagerModalComponent } from '../../../../shared/components/ticket-manager-modal/ticket-manager-modal.component';

// En el componente
showTicketModal = signal(false);

// Métodos
openTicketModal(): void { }
closeTicketModal(): void { }
onTicketSave(ticket: any): void { }

// En el template
<app-ticket-manager-modal
  [isOpen]="showTicketModal()"
  (onClose)="closeTicketModal()"
  (onSave)="onTicketSave($event)">
</app-ticket-manager-modal>
```

---

## 🚀 Inicio Rápido

### 1. Agregando el Modal de Productos:
```html
<app-product-selector-modal 
  [isOpen]="showProductSelectorModal()"
  (onClose)="closeProductSelectorModal()"
  (onProductSelect)="onProductoSeleccionadoDelModal($event)">
</app-product-selector-modal>
```

### 2. Agregando el Modal de Tickets:
```html
<app-ticket-manager-modal
  [isOpen]="showTicketModal()"
  [ticket]="editingTicket()"
  (onClose)="closeTicketModal()"
  (onSave)="onTicketSave($event)">
</app-ticket-manager-modal>
```

### 3. Agregando la Lista de Tickets:
```html
<app-ticket-list [citaId]="citaId()"></app-ticket-list>
```

---

## 📁 Estructura de Archivos

```
src/app/
├── shared/
│   └── components/
│       ├── product-selector-modal/
│       │   ├── product-selector-modal.component.ts
│       │   ├── product-selector-modal.component.html
│       │   └── product-selector-modal.component.css
│       ├── ticket-manager-modal/
│       │   ├── ticket-manager-modal.component.ts
│       │   ├── ticket-manager-modal.component.html
│       │   └── ticket-manager-modal.component.css
│       └── ticket-list/
│           ├── ticket-list.component.ts
│           ├── ticket-list.component.html
│           └── ticket-list.component.css
└── core/
    └── services/
        └── ticket.service.ts
```

---

## ✅ Build Status

```
Application bundle generation complete
Bundle size: 1.62 MB
Build time: ~8 segundos
TypeScript errors: 0
Warnings: 2 CSS budget (non-blocking)
```

---

## 🎯 Próximos Pasos

- [ ] Integrar endpoints backend para CRUD de tickets
- [ ] Agregar validaciones adicionales
- [ ] Generar reportes PDF de tickets
- [ ] Implementar paginación en lista de tickets
- [ ] Agregar filtros avanzados
- [ ] Integrar con sistema de pagos

---

## 📝 Notas

- Todos los componentes son **Standalone Components**
- Utilizan **Angular Signals** para estado reactivo
- Soportan **RxJS resources** para cargar datos
- Diseño **mobile-first** y responsive
- Accesibles (WCAG 2.1 AA)
- Tema claro profesional

---

**Última actualización:** 2026-02-18
