import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicHeaderComponent } from '../../components/public-header/public-header.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink, PublicHeaderComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
})
export class LandingPageComponent {
  private readonly _appStoreUrl = 'https://apps.apple.com/fr/app/saloons/id6758464092';
  currentYear = new Date().getFullYear();
  showInstagramBrowserNotice = false;

  scrollTo(id: string): void {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  handleAppStoreClick(event: MouseEvent): void {
    const userAgent = navigator.userAgent;
    const isInstagramOnIos = /Instagram/i.test(userAgent) && /iPhone|iPad|iPod/i.test(userAgent);

    if (!isInstagramOnIos) {
      return;
    }

    event.preventDefault();
    this.showInstagramBrowserNotice = true;
  }

  openAppStoreOutsideInstagram(): void {
    const encodedAppStoreUrl = encodeURIComponent(this._appStoreUrl);
    window.location.href = `instagram://extbrowser/?url=${encodedAppStoreUrl}`;
  }

  closeInstagramBrowserNotice(): void {
    this.showInstagramBrowserNotice = false;
  }
}
