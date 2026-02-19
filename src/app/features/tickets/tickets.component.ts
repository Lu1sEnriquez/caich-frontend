import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketsTableComponent } from './components/tickets-table.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, TicketsTableComponent],
  template: `
    <div class="tickets-container">
      <app-tickets-table 
        #table
        (onCreateClick)="onCreateTicket()"
        (onEditTicket)="onEditTicket($event)"
        (onRefreshTable)="onRefreshTable()">
      </app-tickets-table>
    </div>
  `,
  styles: [`
    .tickets-container {
      padding: 20px;
      height: 100%;
      width: 100%;
    }
  `]
})
export class TicketsComponent {
  private router = inject(Router);

  @ViewChild('table') table!: TicketsTableComponent;

  onCreateTicket(): void {
    this.router.navigate(['/tickets/nuevo']);
  }

  onEditTicket(ticketId: number): void {
    this.router.navigate(['/tickets/nuevo'], { queryParams: { ticketId } });
  }

  onRefreshTable(): void {
    if (this.table) {
      this.table.loadTickets();
    }
  }
}
