import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicHeaderComponent } from '../../components/public-header/public-header.component';

@Component({
  selector: 'app-download-page',
  standalone: true,
  imports: [RouterLink, PublicHeaderComponent],
  templateUrl: './download-page.component.html',
  styleUrl: './download-page.component.scss',
})
export class DownloadPageComponent implements OnInit {
  readonly appStoreUrl = 'https://apps.apple.com/fr/app/saloons/id6758464092';
  readonly googlePlayUrl = 'https://play.google.com/store/apps/details?id=com.saloons.app';
  readonly currentYear = new Date().getFullYear();
  showInstagramBrowserNotice = false;

  ngOnInit(): void {
    const userAgent = navigator.userAgent;
    this.showInstagramBrowserNotice =
      /Instagram/i.test(userAgent) && /iPhone|iPad|iPod/i.test(userAgent);
  }

  openAppStoreOutsideInstagram(): void {
    const encodedAppStoreUrl = encodeURIComponent(this.appStoreUrl);
    window.location.href = `instagram://extbrowser/?url=${encodedAppStoreUrl}`;
  }

  closeInstagramBrowserNotice(): void {
    this.showInstagramBrowserNotice = false;
  }
}
