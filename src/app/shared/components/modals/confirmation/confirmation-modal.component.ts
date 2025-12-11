import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from "../../ui/button/button.component";

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.css'],
})
export class ConfirmationModalComponent {
  title = input<string>('Confirmar acción');
  message = input<string>('¿Estás seguro de que deseas continuar?');
  type = input<'warning' | 'danger' | 'info' | 'success'>('warning');
  confirmText = input<string>('Confirmar');
  cancelText = input<string>('Cancelar');
  confirmVariant = input<'primary' | 'destructive' | 'secondary'>('primary');

  confirm = output<void>();
  cancel = output<void>();
}
