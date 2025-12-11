import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

// Card Description Component
@Component({
  selector: 'app-card-description',
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./card-description.component.html",
  styleUrls: ["./card-description.component.css"],
})
export class CardDescriptionComponent {}
