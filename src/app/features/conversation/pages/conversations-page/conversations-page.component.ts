import { Component } from '@angular/core';
import { ListConversationComponent } from '../../components/list-conversation/list-conversation.component';
import { HeaderComponent } from '../../../../common/components/header/header.component';
import { NavbarComponent } from '../../../../common/components/navbar/navbar.component';
import { ListMatchComponent } from '../../../match/components/list-match/list-match.component';

@Component({
  selector: 'app-conversations-page',
  standalone: true,
  imports: [ListConversationComponent, HeaderComponent, NavbarComponent, ListMatchComponent],
  templateUrl: './conversations-page.component.html',
  styleUrl: './conversations-page.component.scss',
})
export class ConversationsPageComponent {
  conversationUserIds: number[] = [];

  updateConversationUserIds(ids: number[]): void {
    this.conversationUserIds = ids;
  }
}
