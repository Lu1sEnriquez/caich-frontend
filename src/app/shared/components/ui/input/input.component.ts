import { Component, input, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type InputType = 'text' | 'email' | 'password' | 'tel' | 'number' | 'date' | 'search';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./input.component.html",
  styleUrls: ["./input.component.css"],
})
export class InputComponent {
  id = input<string>(`input-${Math.random().toString(36).substr(2, 9)}`);
  type = input<InputType>('text');
  label = input<string>('');
  placeholder = input<string>('');
  disabled = input<boolean>(false);
  required = input<boolean>(false);
  readonly = input<boolean>(false);
  prefixIcon = input<boolean>(false);
  suffixIcon = input<boolean>(false);
  error = input<string>('');
  hint = input<string>('');

  value = model<string>('');

  blurred = output<void>();
  focused = output<void>();

  onBlur() {
    this.blurred.emit();
  }

  onFocus() {
    this.focused.emit();
  }
}
