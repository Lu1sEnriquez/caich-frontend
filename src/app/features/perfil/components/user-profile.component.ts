import { Component, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';

import {
  CardComponent,
  CardContentComponent,
} from '../../../shared/components/ui/card';

import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { InputComponent } from '../../../shared/components/ui/input/input.component';
import { AvatarComponent } from '../../../shared/components/ui/avatar/avatar.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';

import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../core/services/users.service';
import { of } from 'rxjs';
import { ActualizarUsuarioDTO, CambiarPasswordDTO } from '../../../core/models/api-models';
import { mapUserFromApi } from '../../../core/mappers/mappers';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    CardContentComponent,
    ButtonComponent,
    InputComponent,
    AvatarComponent,
    BadgeComponent,
  ],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
})
export class UserProfileComponent {
  private authService = inject(AuthService);
  private usersService = inject(UsersService);

  // Estado del componente
  showPasswordDialog = signal(false);

  // Triggers para rxResource
  profileTrigger = signal(1);
  updateTrigger = signal(0);
  passwordTrigger = signal(0);
  uploadPhotoTrigger = signal(0);

  // Estado para subida de foto
  selectedPhotoFile = signal<File | null>(null);

  // Obtener perfil
  profileResource = rxResource({
    params: () => ({ trigger: this.profileTrigger() }),
    stream: ({ params }) => {
      if (params.trigger === 0) return of(null);

      const userId = this.authService.currentUser()?.id;
      if (!userId) {
        console.error('No hay usuario autenticado');
        return of(null);
      }

      console.log('Cargando perfil desde API para usuario:', userId);
      return this.usersService.getUserById(userId);
    },
  });

  // Datos del usuario - usar User completo en lugar de AuthUser
  user = computed(() => {
    const profile = this.profileResource.value();

    if (profile?.data) {
      const mappedUser = mapUserFromApi(profile.data);
      console.log('Perfil cargado desde API:', mappedUser);
      return mappedUser;
    }

    console.log('No hay datos del usuario disponibles');
    return null;
  });

  // Formularios - usar propiedades normales para permitir two-way binding con ngModel
  formData = {
    nombreCompleto: '',
    email: '',
    telefono: '',
    folio: '',
  };

  passwordForm = {
    passwordActual: '',
    passwordNueva: '',
    confirmarPassword: '',
  };

  // Actualizar perfil
  updateResource = rxResource({
    params: () => ({ trigger: this.updateTrigger() }),
    stream: ({ params }) => {
      if (params.trigger === 0) return of(null);

      const userId = this.authService.currentUser()?.id;
      if (!userId) return of(null);

      const data: ActualizarUsuarioDTO = {
        nombreCompleto: this.formData.nombreCompleto,
        email: this.formData.email,
        telefono: this.formData.telefono,
        folio: this.formData.folio,
      };

      console.log('Actualizando perfil:', data);
      return this.usersService.updateUser(userId, data);
    },
  });

  // Cambiar contraseña
  passwordResource = rxResource({
    params: () => ({ trigger: this.passwordTrigger() }),
    stream: ({ params }) => {
      if (params.trigger === 0) return of(null);

      const userId = this.authService.currentUser()?.id;
      if (!userId) return of(null);

      const data: CambiarPasswordDTO = {
        currentPassword: this.passwordForm.passwordActual,
        newPassword: this.passwordForm.passwordNueva,
      };

      console.log('Cambiando contrasena...');
      return this.usersService.changePassword(userId, data);
    },
  });

  // Subir foto de perfil
  uploadPhotoResource = rxResource({
    params: () => ({ trigger: this.uploadPhotoTrigger() }),
    stream: ({ params }) => {
      if (params.trigger === 0) return of(null);

      const userId = this.authService.currentUser()?.id;
      const file = this.selectedPhotoFile();

      if (!userId || !file) return of(null);

      console.log('📸 Subiendo foto de perfil...');
      return this.usersService.uploadProfilePhoto(userId, file);
    },
  });

  constructor() {
    // Cargar perfil desde la API automáticamente
    this.profileTrigger.set(1);

    // Effect para actualizar formulario cuando lleguen datos de la API
    effect(() => {
      const profile = this.profileResource.value();
      if (profile?.data) {
        const userData = profile.data;
        console.log('📝 Precargando datos del usuario en formulario:', userData);

        this.formData.nombreCompleto = userData.nombreCompleto || '';
        this.formData.email = userData.email || '';
        this.formData.telefono = userData.telefono || '';
        this.formData.folio = userData.folio || '';
      }
    });
  }

  /**
   * Guardar cambios del perfil
   */
  saveProfile(): void {
    const form = this.formData;

    // Validación
    if (!form.nombreCompleto || !form.email) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      alert('Email invalido');
      return;
    }

    // Validar teléfono si se proporciona (debe ser 10 dígitos)
    if (form.telefono && !/^\d{10}$/.test(form.telefono)) {
      alert('El telefono debe tener 10 digitos');
      return;
    }

    console.log('Guardando cambios del perfil...');
    this.updateTrigger.update((v) => v + 1);

    const checkResult = () => {
      if (this.updateResource.value()) {
        console.log('Perfil actualizado exitosamente');
        alert('Perfil actualizado exitosamente');
        this.profileTrigger.update((v) => v + 1);
      } else if (!this.updateResource.isLoading() && !this.updateResource.error()) {
        setTimeout(checkResult, 100);
      } else if (this.updateResource.error()) {
        console.error('Error al actualizar perfil:', this.updateResource.error());
        const errorMsg =
          (this.updateResource.error() as any)?.message || 'Error al actualizar perfil';
        alert(`${errorMsg}`);
      }
    };

    checkResult();
  }

  /**
   * Recargar perfil manualmente
   */
  refreshProfile(): void {
    console.log('Recargando perfil...');
    this.profileTrigger.update((v) => v + 1);
  }

  /**
   * Abrir diálogo de cambio de contraseña
   */
  openPasswordDialog(): void {
    this.passwordForm.passwordActual = '';
    this.passwordForm.passwordNueva = '';
    this.passwordForm.confirmarPassword = '';
    this.showPasswordDialog.set(true);
  }

  /**
   * Cerrar diálogo de cambio de contraseña
   */
  closePasswordDialog(): void {
    this.showPasswordDialog.set(false);
    this.passwordForm = {
      passwordActual: '',
      passwordNueva: '',
      confirmarPassword: '',
    };
  }

  /**
   * Cambiar contraseña
   */
  changePassword(): void {
    const form = this.passwordForm;

    // Validación
    if (!form.passwordActual || !form.passwordNueva || !form.confirmarPassword) {
      alert('Por favor completa todos los campos');
      return;
    }

    if (form.passwordNueva.length < 6) {
      alert('La contrasena debe tener al menos 6 caracteres');
      return;
    }

    if (form.passwordNueva !== form.confirmarPassword) {
      alert('Las contrasenas no coinciden');
      return;
    }

    console.log('Cambiando contrasena...');
    this.passwordTrigger.update((v) => v + 1);

    const checkResult = () => {
      if (this.passwordResource.value()) {
        console.log('Contrasena actualizada exitosamente');
        alert('Contrasena actualizada exitosamente');
        this.closePasswordDialog();
        setTimeout(() => alert('Contrasena actualizada exitosamente'), 100);
      } else if (!this.passwordResource.isLoading() && !this.passwordResource.error()) {
        setTimeout(checkResult, 100);
      } else if (this.passwordResource.error()) {
        console.error('Error al cambiar contrasena:', this.passwordResource.error());
        const errorMsg =
          (this.passwordResource.error() as any)?.message || 'Error al cambiar contrasena';
        alert(`${errorMsg}\n\nVerifica que tu contrasena actual sea correcta.`);
      }
    };

    checkResult();
  }

  /**
   * Subir foto de perfil con validación
   */
  uploadPhoto(): void {
    console.log('📸 Abriendo selector de archivo...');

    // Crear input file dinámicamente
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/jpg';

    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];

      if (!file) return;

      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        alert('Solo se permiten archivos JPG o PNG');
        return;
      }

      // Validar tamaño (2MB máximo)
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen no debe superar los 2MB');
        return;
      }

      console.log('Archivo seleccionado:', file.name);
      console.log('   Tipo:', file.type);
      console.log('   Tamano:', (file.size / 1024 / 1024).toFixed(2), 'MB');

      // Guardar archivo y activar resource
      this.selectedPhotoFile.set(file);
      this.uploadPhotoTrigger.update((v) => v + 1);

      // Esperar resultado
      const checkResult = () => {
        if (this.uploadPhotoResource.value()) {
          const response = this.uploadPhotoResource.value()!;
          console.log('Foto subida exitosamente:', response.data);
          alert('Foto de perfil actualizada exitosamente');

          // Recargar perfil para mostrar nueva foto
          this.profileTrigger.update((v) => v + 1);
        } else if (!this.uploadPhotoResource.isLoading() && !this.uploadPhotoResource.error()) {
          setTimeout(checkResult, 100);
        } else if (this.uploadPhotoResource.error()) {
          console.error('Error al subir foto:', this.uploadPhotoResource.error());
          const errorMsg =
            (this.uploadPhotoResource.error() as any)?.message || 'Error al subir la foto';
          alert(errorMsg);
        }
      };

      checkResult();
    };

    input.click();
  }

  /**
   * Descargar datos del usuario en formato JSON
   */
  downloadData(): void {
    const userData = this.user();

    if (!userData) {
      alert('No hay datos para descargar');
      return;
    }

    // Solo incluir datos básicos para evitar errores de tipo
    const data = {
      usuario: {
        id: userData.id,
        nombre: userData.nombreCompleto,
        email: userData.email,
        rol: userData.rol,
        // Solo incluir propiedades que existen en User
        ...(userData.telefono && { telefono: userData.telefono }),
        ...(userData.folio && { folio: userData.folio }),
        ...(userData.idAlumno && { idAlumno: userData.idAlumno }),
        ...(userData.estado && { estado: userData.estado }),
        ...(userData.ultimaConexion && { ultimaConexion: userData.ultimaConexion }),
        ...(userData.fechaCreacion && { fechaCreacion: userData.fechaCreacion }),
      },
      fecha_descarga: new Date().toISOString(),
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const filename = `perfil_${userData.email}_${new Date().toISOString().split('T')[0]}.json`;
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);

    console.log('Datos descargados:', filename);
    alert(`Datos descargados exitosamente\n\nArchivo: ${filename}`);
  }
}
