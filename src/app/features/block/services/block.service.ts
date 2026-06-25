import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export type BlockedUserDTO = {
  id: number;
  blocker: { id: number; userName: string; imgUrl: string };
  blocked: { id: number; userName: string; imgUrl: string };
  createdAt: string;
};

@Injectable({
  providedIn: 'root',
})
export class BlockService {
  private _http = inject(HttpClient);
  private _BASE_URL_API = environment.apiUrl;

  blockUser(userId: number): Observable<{ message: string }> {
    return this._http.post<{ message: string }>(
      `${this._BASE_URL_API}/users/${userId}/block`,
      {}
    );
  }

  getBlockedUserIds(): Observable<{ blockedUserIds: number[] }> {
    return this._http.get<{ blockedUserIds: number[] }>(
      `${this._BASE_URL_API}/users/blocked`
    );
  }

  getAllBlocks(): Observable<BlockedUserDTO[]> {
    return this._http.get<BlockedUserDTO[]>(`${this._BASE_URL_API}/blocks/admin`);
  }
}
