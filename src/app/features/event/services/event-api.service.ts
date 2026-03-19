import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { EventItem, EventPeriod, PagedEvents } from '../models/event.model';

export type ToggleInterestResponse = {
  interested: boolean;
  interestedCount: number;
};

@Injectable({
  providedIn: 'root',
})
export class EventApiService {
  private _http = inject(HttpClient);
  private readonly _BASE_URL = environment.apiUrl;

  getEvents(
    period: EventPeriod = 'all',
    page = 0,
    size = 10,
    lat?: number | null,
    lng?: number | null,
  ): Observable<PagedEvents> {
    let params = new HttpParams()
      .set('period', period)
      .set('page', page.toString())
      .set('size', size.toString());
    if (lat != null && lng != null) {
      params = params.set('lat', lat.toString()).set('lng', lng.toString());
    }
    return this._http.get<PagedEvents>(`${this._BASE_URL}/event`, { params });
  }

  getEventById(id: number): Observable<EventItem> {
    return this._http.get<EventItem>(`${this._BASE_URL}/event/${id}`);
  }

  toggleInterest(eventId: number): Observable<ToggleInterestResponse> {
    return this._http.post<ToggleInterestResponse>(
      `${this._BASE_URL}/event/${eventId}/interest`,
      {}
    );
  }
}
