import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

import { CardComponent } from '../../../shared/components/ui/card/card.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { InputComponent } from '../../../shared/components/ui/input/input.component';
import { AvatarComponent } from '../../../shared/components/ui/avatar/avatar.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';

import type { User } from '../../../core/models/models';
import { UserRole, UserStatus } from '../../../core/models/enums';
import { UsersService } from '../../../core/services/users.service';
import { CrearUsuarioDTO, ActualizarUsuarioDTO } from '../../../core/models/api-models';
import { mapUserFromApi } from '../../../core/mappers/mappers';
import { ExportOptionsModalComponent, ExportOptions } from '../../../shared/components/modals/exportOptions/export-options-modal.component';

// Tipo para los filtros
type UserFilter = 'Todos' | UserRole;

@Component({
  selector: 'app-users-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    ButtonComponent,
    InputComponent,
    AvatarComponent,
    BadgeComponent,
    ExportOptionsModalComponent,
  ],
  templateUrl: './users-table.component.html',
  styleUrls: ['users-table.component.css'],
})
export class UsersTableComponent {
  // Exponer UserRole para el template
  readonly UserRole = UserRole;

  private usersService = inject(UsersService);
  private router = inject(Router);

  // Estado
  searchQuery = signal('');
  selectedFilter = signal<UserFilter>('Todos');
  showUserDialog = signal(false);
  editingUser = signal<User | null>(null);
  showExportModal = signal(false);
  readonly exportFields = [
    'ID',
    'Nombre',
    'Email',
    'Telefono',
    'Rol',
    'Estado',
    'Folio',
    'ID Alumno',
    'Ultima Conexion',
  ];
  readonly availableRoles = [
    'Administrador',
    'Terapeuta',
    'Paciente',
    'Alumno',
  ];

  // Triggers
  usersTrigger = signal(1);
  createUserTrigger = signal(0);
  updateUserTrigger = signal(0);

  // Obtener usuarios
  usersResource = rxResource({
    params: () => ({
      trigger: this.usersTrigger(),
      filter: this.selectedFilter(),
    }),
    stream: ({ params }) => {
      if (params.trigger === 0) return of(null);

      const filters: any = {};

      if (params.filter !== 'Todos') {
        filters.rol = params.filter;
      }

      return this.usersService.getAllUsers(filters);
    },
  });

  // Lista de usuarios
  users = computed(() => {
    const response = this.usersResource.value();
    if (!response) return [];
    console.log('Usuarios cargados:', response.data.content.length);
    return response.data.content.map((dto) => mapUserFromApi(dto));
  });

  // Usuarios filtrados por búsqueda
  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const allUsers = this.users();

    if (!query) return allUsers;

    return allUsers.filter((user) => {
      return (
        user.nombreCompleto.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.rol.toLowerCase().includes(query)
      );
    });
  });

  // Estadísticas
  stats = computed(() => {
    const allUsers = this.users();
    return {
      total: allUsers.length,
      activos: allUsers.filter((u) => u.estado === UserStatus.ACTIVO).length,
      suspendidos: allUsers.filter((u) => u.estado === UserStatus.SUSPENDIDO).length,
    };
  });

  // Formulario de usuario
  userFormData = signal({
    nombreCompleto: '',
    email: '',
    password: '',
    telefono: '',
    folio: '',
    idAlumno: '',
    rol: UserRole.PACIENTE,
  });

  // Crear usuario
  createUserResource = rxResource({
    params: () => ({ trigger: this.createUserTrigger() }),
    stream: ({ params }) => {
      if (params.trigger === 0) return of(null);

      const form = this.userFormData();

      const data: CrearUsuarioDTO = {
        nombreCompleto: form.nombreCompleto,
        email: form.email,
        password: form.password,
        telefono: form.telefono || undefined,
        folio: form.folio || undefined,
        idAlumno: form.idAlumno || undefined,
        rol: form.rol,
      };

      return this.usersService.createUser(data);
    },
  });

  // Actualizar usuario
  updateUserResource = rxResource({
    params: () => ({ trigger: this.updateUserTrigger() }),
    stream: ({ params }) => {
      if (params.trigger === 0) return of(null);

      const user = this.editingUser();
      if (!user) return of(null);

      const form = this.userFormData();

      const data: ActualizarUsuarioDTO = {
        nombreCompleto: form.nombreCompleto,
        email: form.email,
        telefono: form.telefono || undefined,
        folio: form.folio || undefined,
        idAlumno: form.idAlumno || undefined,
        rol: form.rol,
      };

      return this.usersService.updateUser(user.id, data);
    },
  });

  /**
   * Cambiar filtro
   */
  setFilter(filter: UserFilter): void {
    this.selectedFilter.set(filter);
    this.usersTrigger.update((v) => v + 1);
  }

  /**
   * Abrir diálogo de nuevo usuario
   */
  openNewUserDialog(): void {
    this.editingUser.set(null);
    this.userFormData.set({
      nombreCompleto: '',
      email: '',
      password: this.generatePassword(),
      telefono: '',
      folio: '',
      idAlumno: '',
      rol: UserRole.PACIENTE,
    });
    this.showUserDialog.set(true);
  }

  /**
   * Cerrar diálogo
   */
  closeUserDialog(): void {
    this.showUserDialog.set(false);
    this.editingUser.set(null);
  }

  /**
   * Ver usuario
   */
  viewUser(user: User): void {
    console.log('👀 Navegando al detalle del usuario:', user);
    this.router.navigate(['/usuarios', user.id]);
  }

  /**
   * Editar usuario
   */
  editUser(user: User): void {
    this.editingUser.set(user);
    this.userFormData.set({
      nombreCompleto: user.nombreCompleto,
      email: user.email,
      password: '',
      telefono: user.telefono || '',
      folio: user.folio || '',
      idAlumno: user.idAlumno || '',
      rol: user.rol,
    });
    this.showUserDialog.set(true);
  }

  /**
   * Guardar usuario (crear o actualizar)
   */
  saveUser(): void {
    const form = this.userFormData();

    if (!form.nombreCompleto || !form.email) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    if (this.editingUser()) {
      // Actualizar
      console.log('Actualizando usuario...');
      this.updateUserTrigger.update((v) => v + 1);

      const checkResult = () => {
        if (this.updateUserResource.value()) {
          this.closeUserDialog();
          this.usersTrigger.update((v) => v + 1);
          setTimeout(() => alert('Usuario actualizado exitosamente'), 100);
        } else if (!this.updateUserResource.isLoading() && !this.updateUserResource.error()) {
          setTimeout(checkResult, 100);
        } else if (this.updateUserResource.error()) {
          console.error('Error:', this.updateUserResource.error());
          alert('Error al actualizar usuario');
        }
      };

      checkResult();
    } else {
      // Crear
      if (!form.password) {
        alert('La contrasena es requerida para crear un usuario');
        return;
      }

      console.log('➕ Creando usuario...');
      this.createUserTrigger.update((v) => v + 1);

      const checkResult = () => {
        if (this.createUserResource.value()) {
          console.log('Usuario creado');
          this.closeUserDialog();
          this.usersTrigger.update((v) => v + 1);
          setTimeout(() => alert('Usuario creado exitosamente'), 100);
        } else if (!this.createUserResource.isLoading() && !this.createUserResource.error()) {
          setTimeout(checkResult, 100);
        } else if (this.createUserResource.error()) {
          console.error('Error:', this.createUserResource.error());
          alert('Error al crear usuario');
        }
      };

      checkResult();
    }
  }

  /**
   * Generar contraseña aleatoria
   */
  generatePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Regenerar contraseña en el formulario
   */
  regeneratePassword(): void {
    this.userFormData.update((form) => ({
      ...form,
      password: this.generatePassword(),
    }));
  }

  /**
   * Exportar a CSV con campos seleccionables
   */
  exportToCSV(): void {
    const users = this.filteredUsers();

    if (users.length === 0) {
      alert('No hay usuarios para exportar');
      return;
    }

    // Solicitar campos a exportar
    const camposDisponibles = [
      'ID',
      'Nombre',
      'Email',
      'Teléfono',
      'Rol',
      'Estado',
      'Folio',
      'ID Alumno',
      'Última Conexión',
    ];
    const camposSeleccionados = prompt(
      `Selecciona los campos a exportar (separados por coma):\n${camposDisponibles.join(', ')}`,
      camposDisponibles.join(', ')
    );

    if (!camposSeleccionados) return;

    const campos = camposSeleccionados.split(',').map((campo) => campo.trim());

    // Validar campos
    const camposInvalidos = campos.filter((campo) => !camposDisponibles.includes(campo));
    if (camposInvalidos.length > 0) {
      alert(`Campos invalidos: ${camposInvalidos.join(', ')}`);
      return;
    }

    const headers = campos;
    const rows = users.map((u) => {
      const row: any[] = [];
      campos.forEach((campo) => {
        switch (campo) {
          case 'ID':
            row.push(u.id);
            break;
          case 'Nombre':
            row.push(u.nombreCompleto);
            break;
          case 'Email':
            row.push(u.email);
            break;
          case 'Teléfono':
            row.push(u.telefono || '');
            break;
          case 'Rol':
            row.push(u.rol);
            break;
          case 'Estado':
            row.push(u.estado);
            break;
          case 'Folio':
            row.push(u.folio || '');
            break;
          case 'ID Alumno':
            row.push(u.idAlumno || '');
            break;
          case 'Última Conexión':
            row.push(u.ultimaConexion ? u.ultimaConexion.toISOString() : '');
            break;
        }
      });
      return row;
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const filterName =
      this.selectedFilter() === 'Todos' ? 'todos' : this.selectedFilter().toLowerCase();
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `usuarios_${filterName}_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(`Se exportaron ${users.length} usuarios (filtro: ${this.selectedFilter()})`);
  }

  /**
   * Abrir modal de exportación (Reemplaza al prompt)
   */
  openExportModal(): void {
    const users = this.filteredUsers();
    if (users.length === 0) {
      alert('No hay usuarios para exportar');
      return;
    }
    this.showExportModal.set(true);
  }

  /**
   * Ejecutar exportacion con campos y roles seleccionados
   */
  onExportConfirmed(options: ExportOptions): void {
    this.showExportModal.set(false);
    
    // Filtrar usuarios por roles seleccionados
    const allUsers = this.filteredUsers();
    const users = allUsers.filter(u => options.roles.includes(u.rol));
    
    if (users.length === 0) {
      alert('No hay usuarios con los roles seleccionados para exportar');
      return;
    }
    
    const headers = options.fields;

    const rows = users.map((u) => {
      const row: any[] = [];
      options.fields.forEach((campo) => {
        switch (campo) {
          case 'ID':
            row.push(u.id);
            break;
          case 'Nombre':
            row.push(u.nombreCompleto);
            break;
          case 'Email':
            row.push(u.email);
            break;
          case 'Telefono':
            row.push(u.telefono || '');
            break;
          case 'Rol':
            row.push(u.rol);
            break;
          case 'Estado':
            row.push(u.estado);
            break;
          case 'Folio':
            row.push(u.folio || '');
            break;
          case 'ID Alumno':
            row.push(u.idAlumno || '');
            break;
          case 'Ultima Conexion':
            row.push(u.ultimaConexion ? new Date(u.ultimaConexion).toISOString() : '');
            break;
        }
      });
      return row;
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Generar nombre del archivo con roles seleccionados
    const rolesName = options.roles.length === this.availableRoles.length 
      ? 'todos_roles' 
      : options.roles.map(r => r.toLowerCase()).join('_');
    
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `usuarios_${rolesName}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Mensaje de exito opcional o toast
  }
}
