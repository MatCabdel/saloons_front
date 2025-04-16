import { Component, inject } from '@angular/core';
import { NavbarComponent } from '../../../../common/components/navbar/navbar.component';
import { HeaderComponent } from '../../../../common/components/header/header.component';
import { VisitorCardComponent } from '../../components/visitor-card/visitor-card.component';
import { Observable } from 'rxjs';
import { User } from 'src/app/features/user/models/user';
import { CommonModule } from '@angular/common';
import { UserService } from 'src/app/features/user/services/user.service';

@Component({
  selector: 'app-my-saloon-page',
  standalone: true,
  imports: [NavbarComponent, HeaderComponent, VisitorCardComponent, CommonModule],
  templateUrl: './my-saloon-page.component.html',
  styleUrl: './my-saloon-page.component.scss',
})
export class MySaloonPageComponent {
  private _userService = inject(UserService);

  users$: Observable<User[]> = this._userService.getListUser();

  showModal = true;

  closeModal(): void {
    this.showModal = false;
  }

  stopPropagation(event: KeyboardEvent): void {
    event.stopPropagation();
  }
}
