import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./avatar.component.html",
  styleUrls: ["./avatar.component.css"],
})
export class AvatarComponent {
  src = input<string>('');
  alt = input<string>('Avatar');
  name = input<string>('');
  size = input<AvatarSize>('md');
  status = input<'online' | 'offline' | 'busy' | 'away' | ''>('');

  imageError = false;

  initials = computed(() => {
    const fullName = this.name();
    if (!fullName) return '?';

    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`;
    }
    return fullName.substring(0, 2);
  });

  avatarClasses() {
    return ['avatar', `avatar-${this.size()}`].join(' ');
  }

  statusClasses() {
    return ['status-indicator', `status-${this.status()}`].join(' ');
  }

  onImageError() {
    this.imageError = true;
  }
}
