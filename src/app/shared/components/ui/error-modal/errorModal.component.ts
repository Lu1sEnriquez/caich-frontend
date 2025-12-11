import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorHandlerService } from '../../../../core/services/errorHandler.service';

@Component({
  selector: 'app-error-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './errorModa.component.html',
  styleUrls: ['./errorModa.component.css'],
})
export class ErrorModalComponent {
  protected errorService = inject(ErrorHandlerService);

  closeError(id: string): void {
    this.errorService.closeError(id);
  }
}
