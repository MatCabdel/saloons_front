import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CreateReportDTO, Report, ReportStatus } from '../models/report.model';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private _BASE_URL_API = environment.apiUrl;
  private _http = inject(HttpClient);

  /**
   * Crée un nouveau signalement.
   */
  createReport(data: CreateReportDTO): Observable<Report> {
    return this._http.post<Report>(`${this._BASE_URL_API}/reports`, data);
  }

  /**
   * Récupère tous les signalements (admin).
   */
  getAllReports(): Observable<Report[]> {
    return this._http.get<Report[]>(`${this._BASE_URL_API}/reports/admin`);
  }

  /**
   * Récupère les signalements par statut (admin).
   */
  getReportsByStatus(status: ReportStatus): Observable<Report[]> {
    return this._http.get<Report[]>(`${this._BASE_URL_API}/reports/admin/status/${status}`);
  }

  /**
   * Récupère un signalement par ID (admin).
   */
  getReportById(id: number): Observable<Report> {
    return this._http.get<Report>(`${this._BASE_URL_API}/reports/admin/${id}`);
  }

  /**
   * Met à jour le statut d'un signalement (admin).
   */
  updateReportStatus(id: number, status: ReportStatus): Observable<Report> {
    return this._http.patch<Report>(`${this._BASE_URL_API}/reports/admin/${id}/status`, { status });
  }

  /**
   * Compte le nombre de signalements en attente (admin).
   */
  countPendingReports(): Observable<{ count: number }> {
    return this._http.get<{ count: number }>(`${this._BASE_URL_API}/reports/admin/count/pending`);
  }
}
