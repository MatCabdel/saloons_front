import { Component, inject, OnInit } from '@angular/core';
import { HeaderComponent } from '../../../../common/components/header/header.component';
import { MessagerieComponent } from '../../components/messagerie/messagerie.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ConversationService } from 'src/app/features/conversation/services/conversation.service';
import { User } from 'src/app/features/user/models/user';
import { UserStoreService } from 'src/app/features/user/store/user-store.service';

@Component({
  selector: 'app-messages-page',
  standalone: true,
  imports: [HeaderComponent, MessagerieComponent],
  templateUrl: './messages-page.component.html',
  styleUrl: './messages-page.component.scss',
})
export class MessagesPageComponent implements OnInit {
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);
  private _conversationService = inject(ConversationService);
  private _userStore = inject(UserStoreService);
  userTarget?: User;

  ngOnInit(): void {
    const conversationId = Number(this._route.snapshot.paramMap.get('conversationId'));
    this._conversationService.getConversation(conversationId).subscribe(conv => {
      const myId = this._userStore.getUserId();
      this.userTarget = conv.participants.find((u: User) => u.id !== myId);
    });
  }

  goToUserProfil(): void {
    if (this.userTarget) {
      this._router.navigate(['/profil-visitor', this.userTarget.id]);
    }
  }
}
