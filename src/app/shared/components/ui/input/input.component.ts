import { Component, input, model, output, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type InputType = 'text' | 'email' | 'password' | 'tel' | 'number' | 'date' | 'search';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: "./input.component.html",
  styleUrls: ["./input.component.css"],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
})
export class InputComponent implements ControlValueAccessor {
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

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: any): void {
    if (value !== null && value !== undefined) {
      const stringValue = value.toString();
      this.value.set(stringValue);
    } else {
      this.value.set('');
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Puedes usar la señal disabled si lo deseas
  }

  onBlur() {
    this.onTouched();
    this.blurred.emit();
  }

  onFocus() {
    this.focused.emit();
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    this.value.set(value);
    this.onChange(value);
  }
}
