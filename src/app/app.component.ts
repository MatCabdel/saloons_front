import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RightPanelComponent } from './common/components/right-panel/right-panel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RightPanelComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {}
