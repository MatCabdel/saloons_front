import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { verifyEnvironment } from './environments/verify-environment';
import { LOAD_WASM, NgxScannerQrcodeModule } from 'ngx-scanner-qrcode';
import { importProvidersFrom } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

LOAD_WASM('assets/wasm/ngx-scanner-qrcode.wasm').subscribe({
  next: () => console.log('WASM loaded'),
  error: err => console.error('WASM failed to load', err),
});

verifyEnvironment();
bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...(appConfig.providers ?? []),
    importProvidersFrom(NgxScannerQrcodeModule),
    provideAnimationsAsync(),
  ],
}).catch(err => console.error(err));
