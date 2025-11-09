import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppComponent } from "src/app/app.component";

@Component({
  selector: 'app-welcome-page',
  standalone: true,
  imports: [RouterModule, AppComponent],
  templateUrl: './welcome-page.component.html',
  styleUrl: './welcome-page.component.scss',
})
export class WelcomePageComponent {}
