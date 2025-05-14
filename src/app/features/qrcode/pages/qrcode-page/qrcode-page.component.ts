import { Component } from '@angular/core';
import { ScanComponent } from '../../components/scan/scan.component';
import { NavbarComponent } from 'src/app/common/components/navbar/navbar.component';
import { HeaderReverseComponent } from 'src/app/common/components/header-reverse/header-reverse.component';

@Component({
  selector: 'app-qrcode-page',
  standalone: true,
  imports: [ScanComponent, NavbarComponent, HeaderReverseComponent],
  templateUrl: './qrcode-page.component.html',
  styleUrl: './qrcode-page.component.scss',
})
export class QrcodePageComponent {}
