import { Component, inject, input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { APP_ROUTES } from '../../constants/routes.constant';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private _router = inject(Router);

  title = input('');
  usePageBackground = input(false);
  showBackButton = input(false);
  backRoute = input<string>('');
  showMenu = input(true);

  public navigateToWelcome(): void {
    this._router.navigate([APP_ROUTES.SALOONS]);
  }

  goBack(): void {
    if (this.backRoute()) {
      this._router.navigate([this.backRoute()]);
    } else {
      window.history.back();
    }
  }

  goToSaloonRequest(): void {
    this._router.navigate(['/saloon-demande']);
  }
}
