import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventItem } from '../../models/event.model';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-card.component.html',
  styleUrl: './event-card.component.scss',
})
export class EventCardComponent {
  @Input() event!: EventItem;
  @Output() toggleInterest = new EventEmitter<EventItem>();

  get formattedDate(): string {
    if (!this.event.startDateTime) return '';
    const date = new Date(this.event.startDateTime);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  get formattedTime(): string {
    if (!this.event.startDateTime) return '';
    const date = new Date(this.event.startDateTime);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  onToggleInterest(e: MouseEvent): void {
    e.stopPropagation();
    this.toggleInterest.emit(this.event);
  }
}
