import { Component, DestroyRef, inject } from '@angular/core';
import { NavbarComponent } from '../../../../common/components/navbar/navbar.component';
import { VisitorCardComponent } from '../../components/visitor-card/visitor-card.component';
import { map, Observable, switchMap } from 'rxjs';
import { User } from 'src/app/features/user/models/user';
import { CommonModule } from '@angular/common';
import { UserService } from 'src/app/features/user/services/user.service';
import { HeaderReverseComponent } from 'src/app/common/components/header-reverse/header-reverse.component';
import { ActivatedRoute, Router } from '@angular/router';
import { SaloonApiService } from '../../services/saloon-api.service';
import { Saloon } from '../../models/saloonModel';
import { UserStoreService } from 'src/app/features/user/store/user-store.service';
import { CountdownTimerComponent } from '../../components/countdown-timer/countdown-timer.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-my-saloon-page',
  standalone: true,
  imports: [NavbarComponent, HeaderReverseComponent, VisitorCardComponent, CommonModule, CountdownTimerComponent],
  templateUrl: './my-saloon-page.component.html',
  styleUrl: './my-saloon-page.component.scss',
})
export class MySaloonPageComponent {
  private _userService = inject(UserService);
  private _route = inject(ActivatedRoute);
  private _saloonApi = inject(SaloonApiService);
  private _router = inject(Router);
  private _userStore = inject(UserStoreService);
  private _destroyRef = inject(DestroyRef);

  users$: Observable<User[]> = this._route.paramMap.pipe(
    switchMap(params => this._saloonApi.getUsersInSaloon(params.get('id')!)),
    map(users => users.filter(user => user.id !== Number(this._userStore.getUserId())))
  );

  saloon$: Observable<Saloon> = this._route.paramMap.pipe(switchMap(params => this._saloonApi.getSaloonById(params.get('id')!)));

  showModal = true;

  closeModal(): void {
    this.showModal = false;
  }

  stopPropagation(event: KeyboardEvent): void {
    event.stopPropagation();
  }

  goToVisitorProfil(userId: number, saloonId: number): void {
    this._router.navigate(['/profil-visitor', userId], { queryParams: { saloonId } });
  }

  disconnectUserFromSaloon(): void {
    const userId = this._userStore.getUserId();
    if (!userId) return;
    this._userService
      .disconnectUserFromSaloon(userId)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => {
        this._router.navigate(['/saloons']);
      });
  }
}
