import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from 'src/app/common/components/header/header.component';
import { TERMS_TEXT } from 'src/app/features/auth/legal/legal-texts';

@Component({
  selector: 'app-terms-page',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './terms-page.component.html',
  styleUrls: ['../legal-notices-page/legal-notices-page.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class TermsPageComponent {
  legalText = TERMS_TEXT;
}
