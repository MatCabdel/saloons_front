import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-public-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './public-header.component.html',
  styleUrl: './public-header.component.scss',
})
export class PublicHeaderComponent {
  menuOpen = false;

  constructor(private readonly _router: Router) {}

  closeMenu(): void {
    this.menuOpen = false;
  }

  goHome(event: Event): void {
    event.preventDefault();
    this.closeMenu();

    if (this._router.url === '/' || this._router.url.startsWith('/#')) {
      this._scrollToTop();
      return;
    }

    void this._router.navigateByUrl('/').then(() => this._scrollToTop());
  }

  goToSection(event: Event, sectionId: string): void {
    event.preventDefault();
    this.closeMenu();

    void this._router.navigate(['/'], { fragment: sectionId }).then(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document
            .getElementById(sectionId)
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    });
  }

  private _scrollToTop(): void {
    window.history.replaceState(window.history.state, '', '/');
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      document.scrollingElement?.scrollTo(0, 0);
    });
  }
}
