import { Component } from '@angular/core';
import { NavbarComponent } from '../../../../common/components/navbar/navbar.component';
import { HeaderComponent } from 'src/app/common/components/header/header.component';

@Component({
  selector: 'app-messages-page',
  standalone: true,
  imports: [NavbarComponent, HeaderComponent],
  templateUrl: './messages-page.component.html',
  styleUrl: './messages-page.component.scss',
})
export class MessagesPageComponent {}
