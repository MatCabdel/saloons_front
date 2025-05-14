import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  NgxScannerQrcodeModule,
  NgxScannerQrcodeService,
  ScannerQRCodeConfig,
  ScannerQRCodeResult,
  ScannerQRCodeSelectedFiles,
} from 'ngx-scanner-qrcode';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { UserService } from 'src/app/features/user/services/user.service';
import { UserStoreService } from 'src/app/features/user/store/user-store.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-scan',
  standalone: true,
  imports: [CommonModule, NgxScannerQrcodeModule],
  templateUrl: './scan.component.html',
  styleUrl: './scan.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ScanComponent {
  private _qrcode = inject(NgxScannerQrcodeService);
  private _userService = inject(UserService);
  private _userStore = inject(UserStoreService);
  private _router = inject(Router);
  private _http = inject(HttpClient);
  

  scannedUrl: string = '';

  public qrCodeResult: ScannerQRCodeSelectedFiles[] = [];

  public config: ScannerQRCodeConfig = {
    constraints: {
      video: {
        width: window.innerWidth,
      },
    },
  };

  public onSelects(files: any): void {
    this._qrcode.loadFiles(files).subscribe((res: ScannerQRCodeSelectedFiles[]) => {
      this.qrCodeResult = res;
    });
  }
  public onEvent(e: ScannerQRCodeResult[]): void {
    if (e.length > 0) {
      this.scannedUrl = e[0].value;
    }
  }

  public openScannedUrl(): void {
    console.log('scannedUrl:', this.scannedUrl);

    // 1. Suivre la redirection pour obtenir l'URL finale
    this._http.get(this.scannedUrl!, { observe: 'response', responseType: 'text' }).subscribe({
      next: (response) => {
        // L'URL finale est dans response.url
        const finalUrl = response.url || this.scannedUrl!;
        console.log('finalUrl:', finalUrl);

        const saloonId = this.extractSaloonIdFromUrl(finalUrl);
        const userId = this._userStore.getUserId();

        console.log('userId:', userId, 'saloonId:', saloonId);

        if (!userId || !saloonId || isNaN(userId) || isNaN(saloonId)) {
          alert('Impossible de récupérer l\'utilisateur ou le saloon.');
          return;
        }

        this._userService.connectUserToSaloon(userId, saloonId).subscribe({
          next: () => {
            this._router.navigate([`/mysaloon/${saloonId}`]);
          }
        });
      },
      error: (err: Error) => {
        alert('Impossible de suivre le lien QR code.' + err.message);
      }
    });
  }
  extractSaloonIdFromUrl(url: string): number {
    const parts = url.split('/').filter(Boolean);
    return Number(parts[parts.length - 1]);
  }
}
