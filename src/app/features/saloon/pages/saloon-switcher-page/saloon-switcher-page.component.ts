import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../../../common/components/header/header.component';
import { SwitchListMapComponent } from '../../../../common/components/switch-list-map/switch-list-map.component';
import { NavbarComponent } from '../../../../common/components/navbar/navbar.component';

@Component({
  selector: 'app-saloon-switcher-page',
  standalone: true,
  imports: [CommonModule, HeaderComponent, SwitchListMapComponent, RouterOutlet, NavbarComponent],
  templateUrl: './saloon-switcher-page.component.html',
  styleUrl: './saloon-switcher-page.component.scss',
})
export class SaloonSwitcherPageComponent {}
