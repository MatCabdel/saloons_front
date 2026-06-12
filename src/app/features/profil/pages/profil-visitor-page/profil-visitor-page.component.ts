import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, Observable, switchMap } from 'rxjs';
import { NavbarComponent } from '../../../../common/components/navbar/navbar.component';
import { VisitorProfilComponent } from '../../components/visitor-profil/visitor-profil.component';
import { UserService } from 'src/app/features/user/services/user.service';

@Component({
  selector: 'app-profil-visitor-page',
  standalone: true,
  imports: [CommonModule, NavbarComponent, VisitorProfilComponent],
  templateUrl: './profil-visitor-page.component.html',
  styleUrl: './profil-visitor-page.component.scss',
})
export class ProfilVisitorPageComponent {
  private _route = inject(ActivatedRoute);
  private _userService = inject(UserService);

  profileName$: Observable<string> = this._route.paramMap.pipe(
    switchMap(params => this._userService.getUserById(Number(params.get('id')))),
    map(user => user.userName)
  );

  goBack(): void {
    window.history.back();
  }
}
