import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from 'src/app/common/components/header/header.component';
import { LEGAL_NOTICES_TEXT } from 'src/app/features/auth/legal/legal-texts';

@Component({
  selector: 'app-legal-notices-page',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './legal-notices-page.component.html',
  styleUrls: ['./legal-notices-page.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LegalNoticesPageComponent {
  legalText = LEGAL_NOTICES_TEXT;
}
