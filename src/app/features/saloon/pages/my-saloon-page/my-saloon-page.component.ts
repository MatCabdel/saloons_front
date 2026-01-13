import { Component, DestroyRef, inject } from '@angular/core';
import { NavbarComponent } from '../../../../common/components/navbar/navbar.component';
import { VisitorCardComponent } from '../../components/visitor-card/visitor-card.component';
import { filter, map, Observable, shareReplay, switchMap, timer } from 'rxjs';
import { CommonModule } from '@angular/common';
import { HeaderReverseComponent } from 'src/app/common/components/header-reverse/header-reverse.component';
import { ActivatedRoute, Router } from '@angular/router';
import { SaloonApiService } from '../../services/saloon-api.service';
import { PresenceService, UserPresence } from '../../services/presence.service';
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
  private _route = inject(ActivatedRoute);
  private _saloonApi = inject(SaloonApiService);
  private _presenceService = inject(PresenceService);
  private _router = inject(Router);
  private _userStore = inject(UserStoreService);
  private _destroyRef = inject(DestroyRef);
  private readonly _refreshTrigger$ = timer(0, 3000); // Rafraîchit toutes les 3 secondes

  // Utilise l'endpoint de présence Redis pour obtenir les users connectés
  users$: Observable<UserPresence[]> = this._route.paramMap.pipe(
    map(params => params.get('id')),
    filter((saloonId): saloonId is string => !!saloonId),
    switchMap(saloonId =>
      this._refreshTrigger$.pipe(
        switchMap(() => this._presenceService.getPresence(Number(saloonId))),
        map(presence => presence.connectedUsers.filter(user => user.id !== Number(this._userStore.getUserId())))
      )
    ),
    takeUntilDestroyed(this._destroyRef),
    shareReplay({ bufferSize: 1, refCount: true })
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
}
