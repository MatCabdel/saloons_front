import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { ActiveSession, PresenceService } from 'src/app/features/saloon/services/presence.service';

const FLOATING_ACTIONS_OFFSET = '74px';

@Component({
  selector: 'app-current-saloon-actions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './current-saloon-actions.component.html',
  styleUrl: './current-saloon-actions.component.scss',
})
export class CurrentSaloonActionsComponent implements OnInit, OnDestroy {
  private _router = inject(Router);
  private _presenceService = inject(PresenceService);
  private _destroyRef = inject(DestroyRef);

  activeSession: ActiveSession | null = null;
  isVisible = false;
  private _currentUrl = '';

  ngOnInit(): void {
    this._syncRoute(this._router.url);

    this._presenceService.activeSession$
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(session => {
        this.activeSession = session;
        this._updateVisibility();
      });

    this._router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe(event => {
        this._syncRoute(event.urlAfterRedirects);
      });
  }

  ngOnDestroy(): void {
    this._setFloatingOffset(false);
  }

  openMySaloon(): void {
    if (!this.activeSession) return;
    this._router.navigate(['/mysaloon', this.activeSession.saloonId]);
  }

  openSaloonChat(): void {
    if (!this.activeSession) return;
    this._router.navigate(['/saloon-chat', this.activeSession.saloonId]);
  }

  private _syncRoute(url: string): void {
    this._currentUrl = this._normalizeUrl(url);

    if (this._isSupportedRoute(this._currentUrl)) {
      this._presenceService
        .ensureMySessionLoaded()
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe({
          error: () => {
            this._updateVisibility();
          },
        });
    }

    this._updateVisibility();
  }

  private _updateVisibility(): void {
    this.isVisible = this._isSupportedRoute(this._currentUrl) && this.activeSession !== null;
    this._setFloatingOffset(this.isVisible);
  }

  private _isSupportedRoute(url: string): boolean {
    return url === '/chat' || url.startsWith('/saloons') || url.startsWith('/events');
  }

  private _normalizeUrl(url: string): string {
    return url.split('?')[0].split('#')[0];
  }

  private _setFloatingOffset(isVisible: boolean): void {
    document.documentElement.style.setProperty(
      '--floating-saloon-actions-offset',
      isVisible ? FLOATING_ACTIONS_OFFSET : '0px'
    );
  }
}
