import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../../../common/components/header/header.component';
import { NavbarComponent } from '../../../../common/components/navbar/navbar.component';

@Component({
  selector: 'app-event-switcher-page',
  standalone: true,
  imports: [CommonModule, HeaderComponent, RouterOutlet, NavbarComponent],
  templateUrl: './event-switcher-page.component.html',
  styleUrl: './event-switcher-page.component.scss',
})
export class EventSwitcherPageComponent {}
