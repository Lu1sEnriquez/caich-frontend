import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { InputComponent } from '../../../shared/components/ui/input/input.component';
import { RegisterRequest } from '../../../core/models/models';
import { UserRole } from '../../../core/models/enums';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonComponent,
    InputComponent,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Formulario
  nombreCompleto = signal('');
  email = signal('');
  folio = signal('');
  idAlumno = signal('');
  telefono = signal('');
  password = signal('');
  confirmPassword = signal('');
  rol = signal<UserRole>(UserRole.PACIENTE);

  // Estado
  registroExitoso = signal(false);
  registerTrigger = signal(0);

  // Roles disponibles para el select
  readonly rolesDisponibles = [
    { value: UserRole.PACIENTE, label: 'Paciente' },
    { value: UserRole.ALUMNO, label: 'Alumno' },
    { value: UserRole.TERAPEUTA, label: 'Terapeuta' },
    { value: UserRole.ADMINISTRADOR, label: 'Administrador' },
  ];

  // ✅ rxResource para el registro
  registerResource = rxResource({
    params: () => ({ trigger: this.registerTrigger() }),
    stream: ({ params }) => {
      if (params.trigger === 0) return of(null);

      const userData: RegisterRequest = {
        nombreCompleto: this.nombreCompleto(),
        email: this.email(),
        folio: this.folio() || undefined,
        idAlumno: this.idAlumno() || undefined,
        password: this.password(),
        telefono: this.telefono() || undefined,
        rol: this.rol(),
      };

      return this.authService.register(userData);
    },
  });

  constructor() {
    // Si ya está autenticado, redirigir
    if (this.authService.isAuthenticatedSync()) {
      console.log('✅ Usuario ya autenticado, redirigiendo...');
      this.router.navigate(['/dashboard']);
    }
  }

  handleRegister(): void {
    // Validaciones
    if (!this.validateForm()) {
      return;
    }

    console.log('🚀 Iniciando proceso de registro...');
    this.registerTrigger.update((v) => v + 1);

    // Esperar resultado
    const checkResult = () => {
      if (this.registerResource.value()) {
        const response = this.registerResource.value()!;
        console.log('✅ Registro completado exitosamente');

        // Si la API devolvió token, el AuthService ya navegó
        // Si no, mostrar mensaje de éxito
        if (!response.accessToken) {
          this.registroExitoso.set(true);
        }
      } else if (!this.registerResource.isLoading() && !this.registerResource.error()) {
        setTimeout(checkResult, 100);
      } else if (this.registerResource.error()) {
        console.error('❌ Error en registro:', this.registerResource.error());
        // El errorHandler ya muestra el modal
      }
    };

    checkResult();
  }

  /**
   * Validar formulario
   */
  private validateForm(): boolean {
    // 1. Campos requeridos
    if (!this.nombreCompleto()) {
      alert('❌ Nombre completo requerido');
      return false;
    }

    if (!this.email()) {
      alert('❌ Email requerido');
      return false;
    }

    if (!this.password()) {
      alert('❌ Contraseña requerida');
      return false;
    }

    if (!this.confirmPassword()) {
      alert('❌ Confirmar contraseña requerido');
      return false;
    }

    // 2. Formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email())) {
      alert('❌ Email inválido');
      return false;
    }

    // 3. Longitud de contraseña
    if (this.password().length < 6) {
      alert('❌ La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    // 4. Contraseñas coinciden
    if (this.password() !== this.confirmPassword()) {
      alert('❌ Las contraseñas no coinciden');
      return false;
    }

    // 5. idAlumno obligatorio si es alumno
    if (this.rol() === UserRole.ALUMNO && !this.idAlumno()) {
      alert('❌ ID del alumno es obligatorio para el rol de Alumno');
      return false;
    }

    // 6. Teléfono válido (si se proporciona)
    if (this.telefono() && !/^\d{10}$/.test(this.telefono())) {
      alert('❌ El teléfono debe tener 10 dígitos');
      return false;
    }

    return true;
  }

  /**
   * Ir a login
   */
  irALogin(): void {
    console.log('➡️ Redirigiendo a login');
    this.router.navigate(['/login']);
  }
}
