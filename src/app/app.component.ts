import { Component, OnInit, signal } from '@angular/core';
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
  apiStatus = signal<'checking' | 'ok' | 'offline'>('checking');

  ngOnInit(): void {
    this.checkApiReachability();
  }

  async retryApi(): Promise<void> {
    await this.checkApiReachability();
  }

  private async checkApiReachability(): Promise<void> {
    this.apiStatus.set('checking');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      await fetch(environment.apiUrl, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      });
      this.apiStatus.set('ok');
    } catch {
      this.apiStatus.set('offline');
    } finally {
      clearTimeout(timeout);
    }
  }
}
