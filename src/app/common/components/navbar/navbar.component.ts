import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  navItems = [
    { route: '/profil', icon: 'assets/icons/user.svg', alt: 'profil' },
    { route: '/saloons', icon: 'assets/icons/home.svg', alt: 'home' },
    { route: '/chat', icon: 'assets/icons/chat3.svg', alt: 'tchat' },
  ];
}
