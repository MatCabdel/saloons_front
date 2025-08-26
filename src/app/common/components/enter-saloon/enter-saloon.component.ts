import { Component, inject, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-enter-saloon',
  standalone: true,
  imports: [],
  templateUrl: './enter-saloon.component.html',
  styleUrl: './enter-saloon.component.scss',
})
export class EnterSaloonComponent {
  @Input() saloonId!: number;

  private _router = inject(Router);

  goToSaloon(): void {
    if (this.saloonId) {
      this._router.navigate(['/mysaloon', this.saloonId]);
    }
  }
}
