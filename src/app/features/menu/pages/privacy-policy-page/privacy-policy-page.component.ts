import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from 'src/app/common/components/header/header.component';
import { PRIVACY_POLICY_TEXT } from 'src/app/features/auth/legal/legal-texts';

@Component({
  selector: 'app-privacy-policy-page',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './privacy-policy-page.component.html',
  styleUrls: ['../legal-notices-page/legal-notices-page.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class PrivacyPolicyPageComponent {
  legalText = PRIVACY_POLICY_TEXT;
}
