import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

// Card Header Component
@Component({
  selector: 'app-card-content',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-content.component.html',
  styleUrls: ['./card-content.component.css'],
})
export class CardContentComponent {}
