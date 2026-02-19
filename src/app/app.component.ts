import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  ngOnInit(): void {
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
      await fetch(environment.apiUrl, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      });
      console.log('✅ API reachable');
    } catch {
      console.warn('⚠️ API unreachable at startup — the app will retry on user actions');
    } finally {
      clearTimeout(timeout);
    }
  }
}
