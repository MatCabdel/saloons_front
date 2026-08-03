import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { signal } from '@angular/core';
import { GeolocationService } from './core/services/geolocation.service';

type ApiStatus = 'checking' | 'ok' | 'error';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  readonly apiStatus = signal<ApiStatus>('checking');
  private _geoService = inject(GeolocationService);

  ngOnInit(): void {
    this._geoService.init();
    this._checkApiReachability();
  }

  retryApi(): void {
    this.apiStatus.set('checking');
    this._checkApiReachability();
  }

  /**
   * Non-blocking API health check.
   * Logs a warning if the API is unreachable but never blocks the UI.
   * This ensures Apple reviewers always see content at launch.
   */
  private async _checkApiReachability(): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      await fetch(`${environment.apiUrl}/v3/api-docs`, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      });
      console.log('✅ API reachable');
      this.apiStatus.set('ok');
    } catch {
      console.warn('⚠️ API unreachable at startup — the app will retry on user actions');
      this.apiStatus.set('error');
    } finally {
      clearTimeout(timeout);
    }
  }
}
