import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { APP_ROUTES } from '../../constants/routes.constant';

@Component({
  selector: 'app-header-reverse',
  standalone: true,
  imports: [],
  templateUrl: './header-reverse.component.html',
  styleUrl: './header-reverse.component.scss',
})
export class HeaderReverseComponent {
  private _router = inject(Router);

  public navigateToWelcome(): void {
    this._router.navigate([APP_ROUTES.SALOONS]);
  }
}
