import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { BankAccountsService, CrearCuentaBancariaDTO } from '../../../../core/services/bank-accounts.service';
import { BadgeComponent } from '../../../../shared/components/ui/badge/badge.component';

@Component({
  selector: 'app-bank-accounts-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BadgeComponent,
  ],
  templateUrl: './bank-accounts-management.component.html',
  styleUrls: ['./bank-accounts-management.component.css'],
})
export class BankAccountsManagementComponent {
  private accountsService = inject(BankAccountsService);
  private fb = inject(FormBuilder);

  private accountsTrigger = signal(1);

  // Modal
  showModal = signal(false);
  isEditing = signal(false);
  currentEditId = signal<number | null>(null);

  // Form
  form = this.fb.group({
    banco: ['', [Validators.required, Validators.minLength(2)]],
    numeroCuenta: ['', [Validators.required, Validators.minLength(4)]],
    clabe: [''],
    titular: ['', [Validators.required, Validators.minLength(2)]],
    estaActiva: [true],
  });

  // Obtener cuentas
  accountsResource = rxResource({
    params: () => ({ trigger: this.accountsTrigger() }),
    stream: ({ params }) => {
      if (params.trigger === 0) return of(null);
      return this.accountsService.getAll().pipe(
        catchError((error) => {
          console.error('Error cargando cuentas:', error);
          return of(null);
        })
      );
    },
  });

  // Computed
  accounts = computed(() => this.accountsResource.value()?.data || []);

  openModal() {
    this.showModal.set(true);
    this.isEditing.set(false);
    this.currentEditId.set(null);
    this.form.reset({ estaActiva: true });
  }

  closeModal() {
    this.showModal.set(false);
    this.form.reset();
  }

  editAccount(account: any) {
    this.isEditing.set(true);
    this.currentEditId.set(account.cuentaId);
    this.form.patchValue(account);
    this.showModal.set(true);
  }

  saveAccount() {
    if (this.form.invalid) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    const formValue = this.form.value;
    const dto: CrearCuentaBancariaDTO = {
      banco: formValue.banco!,
      numeroCuenta: formValue.numeroCuenta!,
      clabe: formValue.clabe || undefined,
      titular: formValue.titular!,
      estaActiva: formValue.estaActiva ?? true,
    };

    const operation = this.isEditing()
      ? this.accountsService.update(this.currentEditId()!, dto)
      : this.accountsService.create(dto);

    operation.subscribe({
      next: () => {
        alert(
          `Cuenta ${this.isEditing() ? 'actualizada' : 'creada'} exitosamente`
        );
        this.accountsTrigger.update((v) => v + 1);
        this.closeModal();
      },
      error: (error) => {
        console.error('Error:', error);
        alert(`Error: ${error.error?.message || 'Error desconocido'}`);
      },
    });
  }

  deleteAccount(account: any) {
    const confirm = window.confirm(
      `¿Estás seguro de que deseas eliminar la cuenta de ${account.titular}?`
    );
    if (!confirm) return;

    this.accountsService.delete(account.cuentaId).subscribe({
      next: () => {
        alert('Cuenta eliminada exitosamente');
        this.accountsTrigger.update((v) => v + 1);
      },
      error: (error) => {
        console.error('Error:', error);
        alert(`Error: ${error.error?.message || 'No se puede eliminar esta cuenta'}`);
      },
    });
  }

  toggleStatus(account: any) {
    const newStatus = !account.estaActiva;
    this.accountsService.changeStatus(account.cuentaId, newStatus).subscribe({
      next: () => {
        alert(`Estado actualizado a ${newStatus ? 'Activa' : 'Inactiva'}`);
        this.accountsTrigger.update((v) => v + 1);
      },
      error: (error) => {
        console.error('Error:', error);
        alert(`Error: ${error.error?.message || 'Error desconocido'}`);
      },
    });
  }

  maskAccountNumber(num: string): string {
    if (num.length <= 4) return num;
    return '**** ' + num.slice(-4);
  }

  maskCLABE(clabe: string): string {
    if (!clabe || clabe.length === 0) return 'N/A';
    if (clabe.length <= 4) return clabe;
    return '**** **** **** *' + clabe.slice(-4);
  }
}
