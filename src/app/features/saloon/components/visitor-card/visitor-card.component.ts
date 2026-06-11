import { Component, EventEmitter, Input, Output } from '@angular/core';
import { VersionedImageUrlPipe } from 'src/app/common/pipes/versioned-image-url.pipe';
import { User } from 'src/app/features/user/models/user';
import { UserPresence } from '../../services/presence.service';

/** Type union pour accepter User complet ou UserPresence (depuis Redis) */
type VisitorUser = User | UserPresence;

@Component({
  selector: 'app-visitor-card',
  standalone: true,
  imports: [VersionedImageUrlPipe],
  templateUrl: './visitor-card.component.html',
  styleUrl: './visitor-card.component.scss',
})
export class VisitorCardComponent {
  @Input() user!: VisitorUser;
  @Output() cardClick = new EventEmitter<number>();

  onCardClick(): void {
    this.cardClick.emit(this.user.id);
  }

  /** Retourne la ville de l'utilisateur, ou une chaîne vide si non disponible */
  get userCity(): string {
    return 'city' in this.user && this.user.city ? this.user.city : '';
  }
}
