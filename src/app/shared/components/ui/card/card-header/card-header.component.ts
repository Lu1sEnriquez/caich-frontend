import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

// Card Header Component
@Component({
  selector: 'app-card-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./card-header.component.html",
  styleUrls: ["./card-header.component.css"],
})
export class CardHeaderComponent {}
