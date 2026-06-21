import { Component, ViewEncapsulation } from '@angular/core';
import { HeaderComponent } from 'src/app/common/components/header/header.component';

@Component({
  selector: 'app-minor-protection-page',
  standalone: true,
  imports: [HeaderComponent],
  templateUrl: './minor-protection-page.component.html',
  styleUrls: ['../legal-notices-page/legal-notices-page.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class MinorProtectionPageComponent {}
