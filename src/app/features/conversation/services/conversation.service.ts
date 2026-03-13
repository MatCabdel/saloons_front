import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Conversation } from '../models/Conversation';

@Injectable({
  providedIn: 'root',
})
export class ConversationService {
  private _apiUrl = `${environment.apiUrl}/conversations`;
  private readonly _BASE_URL_API = environment.apiUrl;

  private _http = inject(HttpClient);

  getUserConversations(): Observable<{ payload: Conversation[] }> {
    return this._http.get<{ payload: Conversation[] }>(`${this._BASE_URL_API}/conversations`);
  }

  getConversation(id: number): Observable<any> {
    return this._http.get<Conversation>(`${this._apiUrl}/${id}`);
  }

  getMessages(conversationId: number): Observable<any[]> {
    return this._http.get<Conversation[]>(`${this._apiUrl}/${conversationId}/messages`);
  }

  createConversation(participantId: number, saloonId?: number): Observable<Conversation> {
    return this._http.post<Conversation>(`${this._apiUrl}`, { participantId, saloonId });
  }

  deleteConversation(conversationId: number): Observable<void> {
    return this._http.delete<void>(`${this._apiUrl}/${conversationId}`);
  }

  /**
   * Marque une conversation comme lue.
   * Met à jour lastReadAt côté backend.
   */
  markAsRead(conversationId: number): Observable<void> {
    return this._http.post<void>(`${this._apiUrl}/${conversationId}/mark-as-read`, {});
  }
}
