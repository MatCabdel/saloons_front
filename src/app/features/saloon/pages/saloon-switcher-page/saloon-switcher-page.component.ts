import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderReverseComponent } from '../../../../common/components/header-reverse/header-reverse.component';
import { SwitchListMapComponent } from '../../../../common/components/switch-list-map/switch-list-map.component';
import { NavbarComponent } from '../../../../common/components/navbar/navbar.component';

@Component({
  selector: 'app-saloon-switcher-page',
  standalone: true,
  imports: [CommonModule, HeaderReverseComponent, SwitchListMapComponent, RouterOutlet, NavbarComponent],
  templateUrl: './saloon-switcher-page.component.html',
  styleUrl: './saloon-switcher-page.component.scss',
})
export class SaloonSwitcherPageComponent {}
