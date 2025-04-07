import { Component } from '@angular/core';
import { ScanComponent } from '../../components/scan/scan.component';
import { NavbarComponent } from 'src/app/common/components/navbar/navbar.component';
import { HeaderComponent } from '../../../../common/components/header/header.component';

@Component({
  selector: 'app-qrcode-page',
  standalone: true,
  imports: [ScanComponent, NavbarComponent, HeaderComponent],
  templateUrl: './qrcode-page.component.html',
  styleUrl: './qrcode-page.component.scss',
})
export class QrcodePageComponent {}
