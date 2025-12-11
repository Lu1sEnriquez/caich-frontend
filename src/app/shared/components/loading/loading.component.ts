import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'loading.component.html',
  styleUrls: ['loading.component.css'],
})
export class LoadingComponent {
  message = input<string>('Cargando...');
  submessage = input<string>('');
  fullscreen = input<boolean>(false);
}
