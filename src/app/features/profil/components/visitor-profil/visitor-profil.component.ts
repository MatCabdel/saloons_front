import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, map, Observable, switchMap, take } from 'rxjs';
import { MatchService } from 'src/app/features/match/services/match.service';
import {
  ReportModalComponent,
  ReportModalData,
} from 'src/app/features/report/components/report-modal/report-modal.component';
import { User } from 'src/app/features/user/models/user';
import { UserService } from 'src/app/features/user/services/user.service';
import { UserStoreService } from 'src/app/features/user/store/user-store.service';
import { SaloonApiService } from 'src/app/features/saloon/services/saloon-api.service';

@Component({
  selector: 'app-visitor-profil',
  standalone: true,
  imports: [CommonModule, ReportModalComponent],
  templateUrl: './visitor-profil.component.html',
  styleUrl: './visitor-profil.component.scss',
})
export class VisitorProfilComponent implements OnInit {
  private _route = inject(ActivatedRoute);
  private _userService = inject(UserService);
  private _router = inject(Router);
  private _matchService = inject(MatchService);
  private _userStore = inject(UserStoreService);
  private _saloonApi = inject(SaloonApiService);

  data$!: Observable<{ user: User; saloonId: number }>;
  myId = this._userStore.getUserId();
  winkSent = false;

  // Menu options
  isMenuOpen = signal(false);

  // Modal de signalement
  showReportModal = signal(false);
  reportModalData = signal<ReportModalData | null>(null);

  ngOnInit(): void {
    this.data$ = combineLatest([this._route.paramMap, this._route.queryParamMap]).pipe(
      switchMap(([params, queryParams]) => {
        const id = Number(params.get('id'));
        const saloonId = Number(queryParams.get('saloonId'));

        // Vérifie via l'API si un wink a déjà été envoyé
        if (this.myId) {
          this._matchService.hasLiked(Number(this.myId), id).subscribe({
            next: res => {
              this.winkSent = res.hasLiked;
            },
            error: () => {
              this.winkSent = false;
            },
          });
        }

        return this._userService.getUserById(id).pipe(map(user => ({ user, saloonId })));
      })
    );
  }

  goBack(): void {
    window.history.back();
  }

  toggleMenu(): void {
    this.isMenuOpen.update(v => !v);
  }

  openReportModal(user: User, saloonId: number): void {
    this.isMenuOpen.set(false);

    // Récupérer le nom du saloon si disponible
    if (saloonId) {
      this._saloonApi
        .getSaloonById(saloonId.toString())
        .pipe(take(1))
        .subscribe({
          next: saloon => {
            this.reportModalData.set({
              reportedId: user.id,
              reportedUserName: user.userName,
              saloonId,
              saloonName: saloon.name,
            });
            this.showReportModal.set(true);
          },
          error: () => {
            this.reportModalData.set({
              reportedId: user.id,
              reportedUserName: user.userName,
              saloonId,
            });
            this.showReportModal.set(true);
          },
        });
    } else {
      this.reportModalData.set({
        reportedId: user.id,
        reportedUserName: user.userName,
      });
      this.showReportModal.set(true);
    }
  }

  closeReportModal(): void {
    this.showReportModal.set(false);
    this.reportModalData.set(null);
  }

  onReported(): void {
    // Le signalement a été envoyé avec succès
    this.closeReportModal();
  }

  private _computeAge(birthDateISO: string): number {
    const d = new Date(birthDateISO);
    const diff = Date.now() - d.getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  }

  wink(): void {
    if (this.winkSent) return;

    const myId = this._userStore.getUserId();

    this.data$.pipe(take(1)).subscribe(({ user, saloonId }) => {
      const otherId = user?.id;
      if (!myId || !otherId || myId === otherId) {
        return;
      }

      this._matchService.createLike(myId, otherId).subscribe({
        next: res => {
          this.winkSent = true;

          if (res.message === "It's a match!") {
            // Ne pas créer de conversation ici - elle sera créée au premier message
            this._router.navigate(['/match', myId, otherId], { queryParams: { saloonId } });
          }
        },
        error: () => {
          // En cas d'erreur, on considère que le like existe peut-être déjà
          this.winkSent = true;
        },
      });
    });
  }
}
