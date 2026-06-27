import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReportReason } from 'src/app/features/report/models/report.model';
import { environment } from 'src/environments/environment';

export type BlockedUserDTO = {
  id: number;
  blocker: { id: number; userName: string; imgUrl: string; email: string };
  blocked: { id: number; userName: string; imgUrl: string; email: string };
  reason: ReportReason | null;
  reasonDisplayName: string | null;
  description: string | null;
  createdAt: string;
};

export type CreateBlockDTO = {
  reason: ReportReason;
  description?: string;
};

@Injectable({
  providedIn: 'root',
})
export class BlockService {
  private _http = inject(HttpClient);
  private _BASE_URL_API = environment.apiUrl;

  blockUser(userId: number, payload: CreateBlockDTO): Observable<{ message: string }> {
    return this._http.post<{ message: string }>(
      `${this._BASE_URL_API}/users/${userId}/block`,
      payload
    );
  }

  getBlockedUserIds(): Observable<{ blockedUserIds: number[] }> {
    return this._http.get<{ blockedUserIds: number[] }>(`${this._BASE_URL_API}/users/blocked`);
  }

  getAllBlocks(): Observable<BlockedUserDTO[]> {
    return this._http.get<BlockedUserDTO[]>(`${this._BASE_URL_API}/blocks/admin`);
  }
}
