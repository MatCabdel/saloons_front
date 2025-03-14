import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {

  private _router = inject(Router) 

  public navigateToWelcome(): void {
    this._router.navigate(['/saloons']); 
  }
}
