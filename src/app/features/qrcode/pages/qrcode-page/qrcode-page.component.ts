import { Component } from '@angular/core';
import { ScanComponent } from '../../components/scan/scan.component';
import { NavbarComponent } from 'src/app/common/components/navbar/navbar.component';

@Component({
  selector: 'app-qrcode-page',
  standalone: true,
  imports: [ScanComponent, NavbarComponent],
  templateUrl: './qrcode-page.component.html',
  styleUrl: './qrcode-page.component.scss',
})
export class QrcodePageComponent {}
