import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import {
  LOAD_WASM,
  NgxScannerQrcodeService,
  ScannerQRCodeConfig,
  ScannerQRCodeResult,
  ScannerQRCodeSelectedFiles,
} from 'ngx-scanner-qrcode';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { QrScannerService } from '../../services/qr-scanner.service';

@Component({
  selector: 'app-scan',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scan.component.html',
  styleUrl: './scan.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ScanComponent implements OnInit {
  private _qrcode = inject(NgxScannerQrcodeService);
  private _qrScannerService = inject(QrScannerService);
  private _destroyRef = inject(DestroyRef);

  scannedUrl: string = '';
  isWasmLoaded = false;

  public qrCodeResult: ScannerQRCodeSelectedFiles[] = [];

  public config: ScannerQRCodeConfig = {
    constraints: {
      video: {
        width: window.innerWidth,
      },
    },
  };

  ngOnInit(): void {
    this.initializeWasm();
  }

  initializeWasm(): void {
    LOAD_WASM('assets/wasm/ngx-scanner-qrcode.wasm')
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          console.log('WASM loaded for QR scanner');
          this.isWasmLoaded = true;
        },
        error: err => {
          console.error('WASM failed to load:', err);
          alert('Impossible de charger le scanner QR code');
        },
      });
  }

  public onSelects(files: any): void {
    this._qrcode
      .loadFiles(files)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((res: ScannerQRCodeSelectedFiles[]) => {
        this.qrCodeResult = res;
      });
  }
  public onEvent(e: ScannerQRCodeResult[]): void {
    if (e.length > 0) {
      this.scannedUrl = e[0].value;
    }
  }

  public openScannedUrl(): void {
    if (!this.scannedUrl) {
      alert('Aucun QR code scanné');
      return;
    }

    this._qrScannerService
      .processScannedUrl(this.scannedUrl)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        error: err => console.error('Erreur lors du traitement du QR code:', err),
      });
  }

  extractSaloonIdFromUrl(url: string): number {
    const parts = url.split('/').filter(Boolean);
    return Number(parts[parts.length - 1]);
  }
}
