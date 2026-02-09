import { Component, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { InputComponent } from '../../../shared/components/ui/input/input.component';

import { LoginRequest } from '../../../core/models/models';
import { LoadingComponent } from "../../../shared/components/loading/loading.component";
// import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonComponent,
    InputComponent,
    LoadingComponent
],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  // Formulario
  email = signal('');
  password = signal('');

  // Errores de validación
  emailError = signal('');
  passwordError = signal('');

  // Estado de carga
  isLoading = signal(false);

  constructor() {
    // Si ya está autenticado, redirigir
    if (this.authService.isAuthenticatedSync()) {
      console.log('Usuario ya autenticado, redirigiendo...');
      const role = this.authService.currentRole();
      if (role) {
        this.router.navigate(['/dashboard']);
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleLogin(): void {
    // Limpiar errores previos
    this.emailError.set('');
    this.passwordError.set('');

    // Validación básica
    if (!this.email()) {
      this.emailError.set('El email es requerido');
      return;
    }

    if (!this.password()) {
      this.passwordError.set('La contraseña es requerida');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email())) {
      this.emailError.set('Email inválido');
      return;
    }

    // Validar longitud de contraseña
    if (this.password().length < 6) {
      this.passwordError.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    console.log('🚀 Iniciando proceso de login...');
    this.isLoading.set(true);

    const credentials: LoginRequest = {
      email: this.email(),
      password: this.password(),
    };

    this.authService
      .login(credentials)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Login completado exitosamente');
          this.isLoading.set(false);

          // La navegación ya se hace en el servicio
          // pero podemos forzarla aquí también como backup
          setTimeout(() => {
            if (this.router.url === '/login') {
              console.log('Forzando navegacion desde login');
              this.router.navigate(['/dashboard']);
            }
          }, 100);
        },
        error: (error) => {
          console.error('Error en login:', error);
          this.isLoading.set(false);

          // El errorHandler ya muestra el modal
          // Pero podemos mostrar errores en los campos también
          if (error.status === 401) {
            this.emailError.set('Credenciales incorrectas');
            this.passwordError.set('Credenciales incorrectas');
          }
        },
      });
  }

  /**
   * Limpiar error al escribir
   */
  onEmailChange(): void {
    this.emailError.set('');
  }

  onPasswordChange(): void {
    this.passwordError.set('');
  }
}
