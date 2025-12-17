import { Component, inject, OnInit } from '@angular/core';
import { ListConversationComponent } from '../../components/list-conversation/list-conversation.component';
import { HeaderComponent } from '../../../../common/components/header/header.component';
import { NavbarComponent } from '../../../../common/components/navbar/navbar.component';
import { ListMatchComponent } from '../../../match/components/list-match/list-match.component';
import { EnterSaloonComponent } from '../../../../common/components/enter-saloon/enter-saloon.component';
import { SaloonSessionService } from 'src/app/features/saloon/services/saloon-session.service';
import { UserStoreService } from 'src/app/features/user/store/user-store.service';
import { HeaderReverseComponent } from 'src/app/common/components/header-reverse/header-reverse.component';

@Component({
  selector: 'app-conversations-page',
  standalone: true,
  imports: [
    ListConversationComponent,
    HeaderComponent,
    NavbarComponent,
    ListMatchComponent,
    EnterSaloonComponent,
    HeaderReverseComponent,
  ],
  templateUrl: './conversations-page.component.html',
  styleUrl: './conversations-page.component.scss',
})
export class ConversationsPageComponent implements OnInit {
  conversationUserIds: number[] = [];
  monSaloonId?: number;

  private _saloonSession = inject(SaloonSessionService);
  private _userStore = inject(UserStoreService);

  ngOnInit(): void {
    const userId = Number(this._userStore.getUserId());
    this._saloonSession.getSession(userId).subscribe(session => {
      this.monSaloonId = session.saloonId;
    });
  }

  updateConversationUserIds(ids: number[]): void {
    this.conversationUserIds = ids;
  }
}
