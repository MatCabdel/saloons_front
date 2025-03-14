import { Component } from '@angular/core';
import { NavbarComponent } from '../../../../common/components/navbar/navbar.component';

@Component({
  selector: 'app-messages-page',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './messages-page.component.html',
  styleUrl: './messages-page.component.scss',
})
export class MessagesPageComponent {}
