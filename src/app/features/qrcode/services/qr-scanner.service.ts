import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../user/services/user.service';
import { UserStoreService } from '../../user/store/user-store.service';
import { Observable, switchMap, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class QrScannerService {
  private _http = inject(HttpClient);
  private _router = inject(Router);
  private _userService = inject(UserService);
  private _userStore = inject(UserStoreService);

  processScannedUrl(scannedUrl: string): Observable<void> {
    const userId = this._userStore.getUserId();

    if (!userId || isNaN(userId)) {
      throw new Error('Utilisateur non connecté');
    }

    return this._http.get(scannedUrl, { observe: 'response', responseType: 'text' }).pipe(
      switchMap(response => {
        const finalUrl = response.url || scannedUrl;
        const saloonId = this.extractSaloonIdFromUrl(finalUrl);

        if (!saloonId || isNaN(saloonId)) {
          throw new Error("Impossible d'extraire l'ID du saloon depuis l'URL");
        }

        return this._userService.connectUserToSaloon(userId, saloonId);
      }),
      tap(() => {
        const saloonId = this.extractSaloonIdFromUrl(scannedUrl);
        this._router.navigate([`/mysaloon/${saloonId}`]);
      }),
      switchMap(() => [])
    );
  }

  extractSaloonIdFromUrl(url: string): number {
    const parts = url.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1];
    const id = Number(lastPart);

    if (isNaN(id)) {
      throw new Error(`ID de saloon invalide dans l'URL: ${url}`);
    }

    return id;
  }
}
