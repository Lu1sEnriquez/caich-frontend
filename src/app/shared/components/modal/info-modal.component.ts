import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../ui/button/button.component';

export interface ModalAction {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  action: () => void;
}

@Component({
  selector: 'app-info-modal',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    @if (isOpen()) {
    <div class="modal-overlay" (click)="handleOverlayClick($event)">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="modal-header">
          <div class="modal-title-group">
            @if (icon()) {
            <div class="modal-icon">{{ icon() }}</div>
            }
            <h2 class="modal-title">{{ title() }}</h2>
          </div>
          <button class="close-button" (click)="handleClose()">✕</button>
        </div>

        <!-- Content -->
        <div class="modal-content">
          @if (description()) {
          <p class="modal-description">{{ description() }}</p>
          }
          <ng-content></ng-content>
        </div>

        <!-- Footer -->
        @if (actions().length > 0) {
        <div class="modal-footer">
          @for (action of actions(); track $index) {
          <app-button
            [variant]="action.variant || 'outline'"
            (clicked)="action.action()"
          >
            {{ action.label }}
          </app-button>
          }
        </div>
        }
      </div>
    </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1.5rem;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-dialog {
      background: white;
      border-radius: 16px;
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e9ecef;
    }

    .modal-title-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .modal-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 10px;
      font-size: 20px;
    }

    .modal-title {
      font-size: 20px;
      font-weight: 700;
      margin: 0;
      color: #1a1a1a;
    }

    .close-button {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 20px;
      color: #6b7280;
      transition: all 0.2s ease;
    }

    .close-button:hover {
      background: #f3f4f6;
      color: #1a1a1a;
    }

    .modal-content {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
    }

    .modal-description {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 1.5rem 0;
      line-height: 1.6;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.5rem;
      border-top: 1px solid #e9ecef;
      background: #f8f9fa;
    }

    @media (max-width: 768px) {
      .modal-dialog {
        max-width: 100%;
        max-height: 100vh;
        border-radius: 0;
      }

      .modal-overlay {
        padding: 0;
      }
    }
  `],
})
export class InfoModalComponent {
  isOpen = input<boolean>(false);
  title = input<string>('');
  description = input<string>('');
  icon = input<string>('');
  actions = input<ModalAction[]>([]);
  closeOnOverlay = input<boolean>(true);

  closed = output<void>();

  handleClose() {
    this.closed.emit();
  }

  handleOverlayClick(event: MouseEvent) {
    if (this.closeOnOverlay()) {
      this.handleClose();
    }
  }
}
