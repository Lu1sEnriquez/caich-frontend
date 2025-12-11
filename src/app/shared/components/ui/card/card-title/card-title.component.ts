import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

// Card Title Component
@Component({
  selector: 'app-card-title',
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./card-title.component.html",
  styleUrls: ["./card-title.component.css"],
})
export class CardTitleComponent {}
