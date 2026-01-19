import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  ContactForm,
  ContactResponse,
  FaqItem,
  SaloonDemande,
} from '../models/menu.model';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private readonly _apiUrl = environment.apiUrl;

  constructor(private _http: HttpClient) {}

  // FAQ
  getFaqItems(): Observable<FaqItem[]> {
    return this._http.get<FaqItem[]>(`${this._apiUrl}/faq`);
  }

  getFaqByCategory(category: string): Observable<FaqItem[]> {
    return this._http.get<FaqItem[]>(`${this._apiUrl}/faq/category/${category}`);
  }

  // Contact
  sendContactMessage(form: ContactForm): Observable<ContactResponse> {
    return this._http.post<ContactResponse>(`${this._apiUrl}/contact`, form);
  }

  // Saloon à la demande
  submitSaloonDemande(demande: SaloonDemande): Observable<SaloonDemande> {
    return this._http.post<SaloonDemande>(
      `${this._apiUrl}/saloon-demande`,
      demande
    );
  }

  getMySaloonDemandes(): Observable<SaloonDemande[]> {
    return this._http.get<SaloonDemande[]>(`${this._apiUrl}/saloon-demande/my`);
  }

  getSaloonDemandeById(id: number): Observable<SaloonDemande> {
    return this._http.get<SaloonDemande>(`${this._apiUrl}/saloon-demande/${id}`);
  }
}
