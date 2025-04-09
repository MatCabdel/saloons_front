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
    if (this.scannedUrl) {
      window.location.href = this.scannedUrl;
    }
  }
}
