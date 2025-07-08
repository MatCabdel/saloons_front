import { Component } from '@angular/core';
import { ListConversationComponent } from '../../components/list-conversation/list-conversation.component';
import { HeaderComponent } from '../../../../common/components/header/header.component';
import { NavbarComponent } from '../../../../common/components/navbar/navbar.component';

@Component({
  selector: 'app-conversations-page',
  standalone: true,
  imports: [ListConversationComponent, HeaderComponent, NavbarComponent],
  templateUrl: './conversations-page.component.html',
  styleUrl: './conversations-page.component.scss',
})
export class ConversationsPageComponent {}
