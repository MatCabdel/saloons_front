import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { NavbarComponent } from '../../../../common/components/navbar/navbar.component';
import { VisitorCardComponent } from '../../components/visitor-card/visitor-card.component';
import { filter, map, Observable, shareReplay, switchMap, take, timer } from 'rxjs';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from 'src/app/common/components/header/header.component';
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
  imports: [NavbarComponent, HeaderComponent, VisitorCardComponent, CommonModule, CountdownTimerComponent],
  templateUrl: './my-saloon-page.component.html',
  styleUrl: './my-saloon-page.component.scss',
})
export class MySaloonPageComponent implements OnInit {
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

  showModal = false;

  ngOnInit(): void {
    // Vérifie si c'est la première connexion à ce saloon dans cette session
    this._route.paramMap.pipe(take(1)).subscribe(params => {
      const saloonId = params.get('id');
      if (saloonId) {
        const storageKey = `saloon_welcomed_${saloonId}`;
        const hasSeenModal = sessionStorage.getItem(storageKey);

        if (!hasSeenModal) {
          this.showModal = true;
        }
      }
    });
  }

  closeModal(): void {
    this.showModal = false;
    // Marque que l'utilisateur a vu la modal pour ce saloon
    this._route.paramMap.pipe(take(1)).subscribe(params => {
      const saloonId = params.get('id');
      if (saloonId) {
        sessionStorage.setItem(`saloon_welcomed_${saloonId}`, 'true');
      }
    });
  }

  stopPropagation(event: KeyboardEvent): void {
    event.stopPropagation();
  }

  goToVisitorProfil(userId: number, saloonId: number): void {
    this._router.navigate(['/profil-visitor', userId], { queryParams: { saloonId } });
  }

  openSaloonChat(): void {
    this._route.paramMap.pipe(take(1)).subscribe(params => {
      const saloonId = params.get('id');
      if (saloonId) {
        this._router.navigate(['/saloon-chat', saloonId]);
      }
    });
  }
}
