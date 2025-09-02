import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../user/services/user.service';
import { UserStoreService } from '../../user/store/user-store.service';
import { Observable, switchMap, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

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

    // 🔥 CORRECTIF - Corrigez l'URL scannée avec l'environnement
    let correctedUrl = scannedUrl;
    if (scannedUrl.includes('localhost')) {
      correctedUrl = scannedUrl.replace(/https?:\/\/localhost:\d+/, environment.frontendUrl);
      console.log('🔧 URL corrigée avec environnement:', correctedUrl);
    }

    // 🔥 SIMPLIFICATION - Pas besoin d'appeler l'URL, juste extraire l'ID et rediriger
    const saloonId = this.extractSaloonIdFromUrl(correctedUrl);

    if (!saloonId || isNaN(saloonId)) {
      throw new Error("Impossible d'extraire l'ID du saloon depuis l'URL");
    }

    return this._userService.connectUserToSaloon(userId, saloonId).pipe(
      tap(() => {
        console.log('🚀 Redirection vers /mysaloon/' + saloonId);
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
