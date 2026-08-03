import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicHeaderComponent } from '../../components/public-header/public-header.component';

@Component({
  selector: 'app-download-page',
  standalone: true,
  imports: [RouterLink, PublicHeaderComponent],
  templateUrl: './download-page.component.html',
  styleUrl: './download-page.component.scss',
})
export class DownloadPageComponent {
  readonly appStoreUrl = 'https://apps.apple.com/fr/app/saloons/id6758464092';
  readonly googlePlayUrl = 'https://play.google.com/store/apps/details?id=com.saloons.app';
  readonly currentYear = new Date().getFullYear();
}
