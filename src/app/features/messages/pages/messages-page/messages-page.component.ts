import { Component } from '@angular/core';
import { NavbarComponent } from '../../../../common/components/navbar/navbar.component';
import { HeaderReverseComponent } from 'src/app/common/components/header-reverse/header-reverse.component';

@Component({
  selector: 'app-messages-page',
  standalone: true,
  imports: [NavbarComponent, HeaderReverseComponent],
  templateUrl: './messages-page.component.html',
  styleUrl: './messages-page.component.scss',
})
export class MessagesPageComponent {}
