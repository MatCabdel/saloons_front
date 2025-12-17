import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { APP_ROUTES } from '../../constants/routes.constant';
import { PanelService } from '../../services/panel.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private _router = inject(Router);
  private _panelService = inject(PanelService);

  @Input() showBurger = true;
  @Output() burgerClick = new EventEmitter<void>();

  public navigateToWelcome(): void {
    this._router.navigate([APP_ROUTES.SALOONS]);
  }

  public triggerBurger(): void {
    this.burgerClick.emit();
    this._panelService.open();
  }
}
