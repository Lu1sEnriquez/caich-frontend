import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { ErrorHandlerService } from './errorHandler.service';
import { API_BASE } from './api.config';

import { DataResponseDTO, BaseResponseDTO, Producto, CrearProductoRequest, ActualizarProductoRequest } from '../models/api-models';



@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private http = inject(HttpClient);
  private errorHandler = inject(ErrorHandlerService);

 /**
   * Obtener productos paginados (Actualizado para coincidir con el controlador)
   */
 /**
 * Obtener productos paginados con filtros avanzados
 */
getAllProductsPaginable(
  page: number = 0, 
  size: number = 10, 
  filters: {
    nombre?: string,
    categoria?: string,
    estaActivo?: boolean,
    esPrestable?: boolean,
    esVendible?: boolean
  } = {}
): Observable<DataResponseDTO<any>> {
  let params = new HttpParams()
    .set('page', page.toString())
    .set('size', size.toString());

  // Agregar filtros dinámicamente si existen
  if (filters.nombre) params = params.set('nombre', filters.nombre);
  if (filters.categoria) params = params.set('categoria', filters.categoria);
  if (filters.estaActivo !== undefined) params = params.set('estaActivo', filters.estaActivo);
  if (filters.esPrestable !== undefined) params = params.set('esPrestable', filters.esPrestable);
  if (filters.esVendible !== undefined) params = params.set('esVendible', filters.esVendible);

  return this.http.get<DataResponseDTO<any>>(`${API_BASE}/inventario/productos`, { params }).pipe(
    catchError((error) => {
      this.errorHandler.handleHttpError(error, 'Obtener productos');
      return throwError(() => error);
    })
  );
}

  /**
   * Crear nuevo producto 
   * @route POST /inventario/productos
   */
createProduct(productData: CrearProductoRequest): Observable<DataResponseDTO<Producto>> {
    return this.http
      .post<DataResponseDTO<Producto>>(`${API_BASE}/inventario/productos`, productData)
      .pipe(
        tap(() => this.errorHandler.showSuccess('Éxito', 'Producto registrado')),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Error al crear');
          return throwError(() => error);
        })
      );
  }

  /**
   * Actualizar producto 
   * @route PUT /inventario/productos/{id}
   */
  updateProduct(
    productoId: number | string,
    productData: ActualizarProductoRequest
  ): Observable<DataResponseDTO<Producto>> {
    return this.http
      .put<DataResponseDTO<Producto>>(`${API_BASE}/inventario/productos/${productoId}`, productData)
      .pipe(
        tap(() => this.errorHandler.showSuccess('Éxito', 'Producto actualizado')),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Error al actualizar');
          return throwError(() => error);
        })
      );
  }

  /**
   * Desactivar producto (Borrado lógico)
   * @route DELETE /inventario/productos/{id}
   */
  deactivateProduct(productoId: number | string): Observable<BaseResponseDTO> {
    return this.http.delete<BaseResponseDTO>(`${API_BASE}/inventario/productos/${productoId}`).pipe(
      tap(() => {
        this.errorHandler.showSuccess('Desactivado', 'El producto ha sido marcado como inactivo');
      }),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Desactivar producto');
        return throwError(() => error);
      })
    );
  }

  /**
   * Ajustar stock manualmente
   */
  adjustStock(
    productoId: number | string,
    nuevoStock: number,
    motivo: string
  ): Observable<BaseResponseDTO> {
    const params = new HttpParams().set('nuevoStock', String(nuevoStock)).set('motivo', motivo);

    return this.http
      .put<BaseResponseDTO>(`${API_BASE}/inventario/productos/${productoId}/ajustar-stock`, null, {
        params,
      })
      .pipe(
        tap(() => {
          console.log('Stock ajustado');
          this.errorHandler.showSuccess('Stock actualizado', `Nuevo stock: ${nuevoStock}`);
        }),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Ajustar stock');
          return throwError(() => error);
        })
      );
  }

  /**
   * Reducir stock (venta/uso)
   */
  reduceStock(
    productoId: number | string,
    cantidad: number,
    motivo: string,
    referencia: string
  ): Observable<BaseResponseDTO> {
    const params = new HttpParams()
      .set('cantidad', String(cantidad))
      .set('motivo', motivo)
      .set('referencia', referencia);

    return this.http
      .post<BaseResponseDTO>(`${API_BASE}/inventario/productos/${productoId}/reducir-stock`, null, {
        params,
      })
      .pipe(
        tap(() => console.log('Stock reducido:', cantidad)),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Reducir stock');
          return throwError(() => error);
        })
      );
  }

  /**
   * Incrementar stock (entrada/devolución)
   */
  increaseStock(
    productoId: number | string,
    cantidad: number,
    motivo: string,
    referencia: string
  ): Observable<BaseResponseDTO> {
    const params = new HttpParams()
      .set('cantidad', String(cantidad))
      .set('motivo', motivo)
      .set('referencia', referencia);

    return this.http
      .post<BaseResponseDTO>(
        `${API_BASE}/inventario/productos/${productoId}/incrementar-stock`,
        null,
        { params }
      )
      .pipe(
        tap(() => {
          console.log('Stock incrementado:', cantidad);
          this.errorHandler.showSuccess('Stock actualizado', `Se agregaron ${cantidad} unidades`);
        }),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Incrementar stock');
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener productos con stock bajo
   */
  getLowStockProducts(): Observable<DataResponseDTO<Producto[]>> {
    return this.http
      .get<DataResponseDTO<Producto[]>>(`${API_BASE}/inventario/productos/stock-bajo`)
      .pipe(
        tap((response) => {
          console.log('Productos con stock bajo:', response.data.length);
          if (response.data.length > 0) {
            this.errorHandler.showWarning(
              'Stock bajo',
              `Hay ${response.data.length} productos con stock bajo`
            );
          }
        }),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Obtener productos con stock bajo');
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener productos sin stock
   */
  getOutOfStockProducts(): Observable<DataResponseDTO<Producto[]>> {
    return this.http
      .get<DataResponseDTO<Producto[]>>(`${API_BASE}/inventario/productos/sin-stock`)
      .pipe(
        tap((response) => {
          console.log('Productos sin stock:', response.data.length);
          if (response.data.length > 0) {
            this.errorHandler.showWarning(
              'Sin stock',
              `Hay ${response.data.length} productos sin stock`
            );
          }
        }),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Obtener productos sin stock');
          return throwError(() => error);
        })
      );
  }

  /**
   * Buscar productos por término
   */
  searchProducts(searchTerm: string): Observable<DataResponseDTO<Producto[]>> {
    const params = new HttpParams().set('search', searchTerm);

    return this.http
      .get<DataResponseDTO<Producto[]>>(`${API_BASE}/inventario/productos/buscar`, { params })
      .pipe(
        tap((response) =>
          console.log('Busqueda completada:', response.data.length, 'resultados')
        ),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Buscar productos');
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener historial de movimientos de un producto
   */
  getProductMovementHistory(productoId: number | string): Observable<DataResponseDTO<any[]>> {
    //TODO: Implementar endpoint GET /inventario/productos/{id}/movimientos en la API
    console.warn('getProductMovementHistory: Endpoint pendiente en la API');

    return this.http
      .get<DataResponseDTO<any[]>>(`${API_BASE}/inventario/productos/${productoId}/movimientos`)
      .pipe(
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Obtener historial de movimientos');
          return throwError(() => error);
        })
      );
  }
}
