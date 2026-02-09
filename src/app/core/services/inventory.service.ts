import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { ErrorHandlerService } from './errorHandler.service';
import { API_BASE } from './api.config';

import { DataResponseDTO, BaseResponseDTO, Producto } from '../models/api-models';

export interface CrearProductoRequest {
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: 'Material' | 'Libro' | 'Test' | 'Equipo' | 'Otro';
  precio: number;
  stock: number;
  stockMinimo: number;
  esVendible: boolean;
  esPrestable: boolean;
}

export interface ActualizarProductoRequest {
  nombre?: string;
  descripcion?: string;
  categoria?: 'Material' | 'Libro' | 'Test' | 'Equipo' | 'Otro';
  precio?: number;
  stockMinimo?: number;
  esVendible?: boolean;
  esPrestable?: boolean;
  estaActivo?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private http = inject(HttpClient);
  private errorHandler = inject(ErrorHandlerService);

  /**
   * Obtener todos los productos
   */
  getAllProducts(): Observable<DataResponseDTO<Producto[]>> {
    return this.http.get<DataResponseDTO<Producto[]>>(`${API_BASE}/inventario/productos`).pipe(
      tap((response) => console.log('Productos obtenidos:', response.data.length, 'registros')),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Obtener productos');
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener producto por ID
   */
  getProductById(productoId: number | string): Observable<DataResponseDTO<Producto>> {
    return this.http
      .get<DataResponseDTO<Producto>>(`${API_BASE}/inventario/productos/${productoId}`)
      .pipe(
        tap((response) => console.log('Producto obtenido:', response.data.nombre)),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Obtener producto');
          return throwError(() => error);
        })
      );
  }

  /**
   * Crear nuevo producto
   */
  createProduct(productData: CrearProductoRequest): Observable<DataResponseDTO<Producto>> {
    return this.http
      .post<DataResponseDTO<Producto>>(`${API_BASE}/inventario/productos`, productData)
      .pipe(
        tap((response) => {
          console.log('Producto creado:', response.data.nombre);
          this.errorHandler.showSuccess('Producto creado', 'El producto se agrego al inventario');
        }),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Crear producto');
          return throwError(() => error);
        })
      );
  }

  /**
   * Actualizar producto
   */
  updateProduct(
    productoId: number | string,
    productData: ActualizarProductoRequest
  ): Observable<DataResponseDTO<Producto>> {
    return this.http
      .put<DataResponseDTO<Producto>>(`${API_BASE}/inventario/productos/${productoId}`, productData)
      .pipe(
        tap(() => {
          console.log('Producto actualizado');
          this.errorHandler.showSuccess('Producto actualizado', 'Los cambios se guardaron');
        }),
        catchError((error) => {
          this.errorHandler.handleHttpError(error, 'Actualizar producto');
          return throwError(() => error);
        })
      );
  }

  /**
   * Eliminar producto
   */
  deleteProduct(productoId: number | string): Observable<BaseResponseDTO> {
    return this.http.delete<BaseResponseDTO>(`${API_BASE}/inventario/productos/${productoId}`).pipe(
      tap(() => {
        console.log('Producto eliminado');
        this.errorHandler.showSuccess(
          'Producto eliminado',
          'El producto se elimino del inventario'
        );
      }),
      catchError((error) => {
        this.errorHandler.handleHttpError(error, 'Eliminar producto');
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
