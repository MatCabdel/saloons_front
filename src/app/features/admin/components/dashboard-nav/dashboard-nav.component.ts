import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-nav',
  standalone: true,
  imports: [],
  templateUrl: './dashboard-nav.component.html',
  styleUrl: './dashboard-nav.component.scss',
})
export class DashboardNavComponent {
  constructor(private _router: Router) {}

  navigate(page: string): void {
    this._router.navigate(['dashboard', page]);
  }
}
