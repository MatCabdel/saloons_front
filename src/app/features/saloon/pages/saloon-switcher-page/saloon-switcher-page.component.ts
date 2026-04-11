import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../../../common/components/header/header.component';
import { NavbarComponent } from '../../../../common/components/navbar/navbar.component';
import { SaloonBrowseToolbarComponent } from '../../components/saloon-browse-toolbar/saloon-browse-toolbar.component';

@Component({
  selector: 'app-saloon-switcher-page',
  standalone: true,
  imports: [CommonModule, HeaderComponent, SaloonBrowseToolbarComponent, RouterOutlet, NavbarComponent],
  templateUrl: './saloon-switcher-page.component.html',
  styleUrl: './saloon-switcher-page.component.scss',
})
export class SaloonSwitcherPageComponent {}
