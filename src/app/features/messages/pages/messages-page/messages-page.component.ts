import { Component } from '@angular/core';
import { NavbarComponent } from '../../../../common/components/navbar/navbar.component';
import { HeaderComponent } from '../../../../common/components/header/header.component';
import { MessagerieComponent } from '../../components/messagerie/messagerie.component';

@Component({
  selector: 'app-messages-page',
  standalone: true,
  imports: [NavbarComponent, HeaderComponent, MessagerieComponent],
  templateUrl: './messages-page.component.html',
  styleUrl: './messages-page.component.scss',
})
export class MessagesPageComponent {}
