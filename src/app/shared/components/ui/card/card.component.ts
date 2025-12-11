import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css'],
})
export class CardComponent {
  padding = input<'none' | 'compact' | 'default' | 'spacious'>('default');
  hoverable = input<boolean>(false);

  cardClasses() {
    const paddingClass = this.padding() === 'none' ? 'card-no-padding' : `card-${this.padding()}`;

    return ['card', paddingClass, this.hoverable() ? 'card-hoverable' : '']
      .filter(Boolean)
      .join(' ');
  }
}
