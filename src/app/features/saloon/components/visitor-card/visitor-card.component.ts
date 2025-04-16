import { Component, Input } from '@angular/core';
import { User } from 'src/app/features/user/models/user';

@Component({
  selector: 'app-visitor-card',
  standalone: true,
  imports: [],
  templateUrl: './visitor-card.component.html',
  styleUrl: './visitor-card.component.scss'
})
export class VisitorCardComponent {
  @Input() user!: User;
}
