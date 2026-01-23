import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-undo-leave-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './undo-leave-toast.component.html',
  styleUrl: './undo-leave-toast.component.scss',
})
export class UndoLeaveToastComponent implements OnInit, OnDestroy {
  @Input() isVisible = false;
  @Input() pendingUntil = 0; // timestamp Unix en ms
  @Output() undoClicked = new EventEmitter<void>();
  @Output() expired = new EventEmitter<void>();

  remainingSeconds = 30;
  private _timerInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    if (this.isVisible && this.pendingUntil > 0) {
      this._startCountdown();
    }
  }

  ngOnDestroy(): void {
    this._stopCountdown();
  }

  private _startCountdown(): void {
    this._stopCountdown();
    this._updateRemaining();

    this._timerInterval = setInterval(() => {
      this._updateRemaining();
      if (this.remainingSeconds <= 0) {
        this._stopCountdown();
        this.expired.emit();
      }
    }, 1000);
  }

  private _stopCountdown(): void {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  }

  private _updateRemaining(): void {
    const now = Date.now();
    const diff = Math.max(0, Math.ceil((this.pendingUntil - now) / 1000));
    this.remainingSeconds = diff;
  }

  onUndo(): void {
    this._stopCountdown();
    this.undoClicked.emit();
  }
}
