import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HeartRequest, HeartRequestStatus, SendHeartRequest } from '../models/Conversation';

@Injectable({
  providedIn: 'root',
})
export class HeartRequestService {
  private _apiUrl = `${environment.apiUrl}/heart-requests`;
  private _http = inject(HttpClient);

  /**
   * Envoie un coup de cœur
   */
  sendHeartRequest(request: SendHeartRequest): Observable<HeartRequest> {
    return this._http.post<HeartRequest>(this._apiUrl, request);
  }

  /**
   * Récupère le statut des coups de cœur pour une conversation
   */
  getHeartRequestStatus(conversationId: number): Observable<HeartRequestStatus> {
    return this._http.get<HeartRequestStatus>(`${this._apiUrl}/status/${conversationId}`);
  }

  /**
   * Récupère les coups de cœur envoyés
   */
  getSentHeartRequests(): Observable<HeartRequest[]> {
    return this._http.get<HeartRequest[]>(`${this._apiUrl}/sent`);
  }

  /**
   * Récupère les coups de cœur reçus
   */
  getReceivedHeartRequests(): Observable<HeartRequest[]> {
    return this._http.get<HeartRequest[]>(`${this._apiUrl}/received`);
  }
}
