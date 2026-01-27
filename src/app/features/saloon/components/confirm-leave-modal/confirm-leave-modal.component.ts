import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-leave-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-leave-modal.component.html',
  styleUrl: './confirm-leave-modal.component.scss',
})
export class ConfirmLeaveModalComponent {
  @Input() isOpen = false;
  @Input() isPremium = false;
  @Input() saloonName = '';
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onBackdropClick(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onCancel();
    }
  }
}
