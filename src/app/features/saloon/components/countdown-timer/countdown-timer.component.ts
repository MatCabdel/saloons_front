import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { UserStoreService } from 'src/app/features/user/store/user-store.service';
import { SaloonSessionService } from '../../services/saloon-session.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-countdown-timer',
  standalone: true,
  imports: [],
  templateUrl: './countdown-timer.component.html',
  styleUrl: './countdown-timer.component.scss',
})
export class CountdownTimerComponent implements OnInit {
  countdown: string = '';
  private _sub?: Subscription;

  private _sessionService = inject(SaloonSessionService);
  private _userStore = inject(UserStoreService);
  private _destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const userId = this._userStore.getUserId();
    if (userId) {
      this._sessionService
        .getSession(userId)
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe({
          next: session => this.startCountdown(session.connectedAt),
          error: () => {
            this.countdown = '';
          },
        });
    }
  }

  startCountdown(connectedAt: string): void {
    const start = new Date(connectedAt).getTime();
    const end = start + 3 * 60 * 60 * 1000;

    this._sub = interval(1000)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => {
        const now = Date.now();
        const diff = end - now;
        if (diff <= 0) {
          this.countdown = '00:00:00';
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          this.countdown = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
      });
  }
}
