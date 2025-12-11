import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'success' | 'warning' | 'destructive' | 'info' | 'secondary' | 'outline' | 'danger';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./badge.component.html",
  styleUrls: ["./badge.component.css"],
})
export class BadgeComponent {
  variant = input<BadgeVariant>('info');
  status = input<string>('');

  badgeClasses() {
    const statusClass = this.status()
      ? `badge-${this.status().toLowerCase().replace(/\s+/g, '-')}`
      : '';
    return ['badge', `badge-${this.variant()}`, statusClass].filter(Boolean).join(' ');
  }
}
