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
    { route: '/scan', icon: 'assets/icons/qrcode2.svg', alt: 'qrcode' },
    { route: '/profil', icon: 'assets/icons/user.svg', alt: 'profil' },
    { route: '/saloons', icon: 'assets/icons/home.svg', alt: 'tchat' },
    { route: '/chat', icon: 'assets/icons/chat3.svg', alt: 'tchat' },
  ];
}
