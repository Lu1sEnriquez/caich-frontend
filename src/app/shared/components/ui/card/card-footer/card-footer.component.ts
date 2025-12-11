import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

// Card Header Component
@Component({
  selector: 'app-card-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./card-footer.component.html",
  styleUrls: ["./card-footer.component.css"],
})
export class CardFooterComponent {}
