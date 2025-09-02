import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, ViewChild } from '@angular/core';
import { ZXingScannerModule, ZXingScannerComponent } from '@zxing/ngx-scanner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { QrScannerService } from '../../services/qr-scanner.service';

@Component({
  selector: 'app-scan',
  standalone: true,
  imports: [CommonModule, ZXingScannerModule],
  templateUrl: './scan.component.html',
  styleUrl: './scan.component.scss',
})
export class ScanComponent {
  @ViewChild('action', { static: false }) scanner!: ZXingScannerComponent;

  private _qrScannerService = inject(QrScannerService);
  private _destroyRef = inject(DestroyRef);

  scannedUrl: string = '';
  isLoading = false;
  isStarted = false;
  availableDevices: MediaDeviceInfo[] = [];
  currentDevice?: MediaDeviceInfo;

  public onScanSuccess(result: string): void {
    this.scannedUrl = result;
    console.log('QR Code scanné:', result);
  }

  public onScanError(error: any): void {
    console.warn('Erreur scan:', error);
  }

  public onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    if (devices && devices.length > 0) {
      const backCamera = devices.find(device => device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('rear'));
      this.currentDevice = backCamera || devices[0];
    }
  }

  public onPermissionResponse(permission: boolean): void {
    console.log('Permission caméra:', permission);
  }

  public toggleScanner(): void {
    if (this.scanner) {
      if (this.isStarted) {
        this.scanner.camerasNotFound.emit();
        this.isStarted = false;
      } else {
        this.scanner.camerasFound.emit(this.availableDevices);
        this.isStarted = true;
      }
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
