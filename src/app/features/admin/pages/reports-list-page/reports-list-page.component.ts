import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from 'src/app/features/report/services/report.service';
import { Report, ReportStatus, REPORT_STATUS_LABELS } from 'src/app/features/report/models/report.model';

type FilterOption = 'ALL' | ReportStatus;

@Component({
  selector: 'app-reports-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports-list-page.component.html',
  styleUrl: './reports-list-page.component.scss',
})
export class ReportsListPageComponent implements OnInit {
  private _reportService = inject(ReportService);

  reports = signal<Report[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Computed for pending count
  pendingCount = computed(() => this.reports().filter(r => r.status === ReportStatus.PENDING).length);

  // Filter
  filterOption = signal<FilterOption>('ALL');

  // Modal state
  showDetailModal = signal(false);
  selectedReport = signal<Report | null>(null);
  updatingStatus = signal(false);

  // Status labels for display and enum values for template
  readonly statusLabels = REPORT_STATUS_LABELS;
  readonly ReportStatus = ReportStatus;
  readonly filterOptions: { value: FilterOption; label: string }[] = [
    { value: 'ALL', label: 'Tous' },
    { value: ReportStatus.PENDING, label: 'En attente' },
    { value: ReportStatus.REVIEWED, label: 'Examinés' },
    { value: ReportStatus.RESOLVED, label: 'Résolus' },
    { value: ReportStatus.DISMISSED, label: 'Rejetés' },
  ];

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.loading.set(true);
    this.error.set(null);

    const filter = this.filterOption();

    const request$ =
      filter === 'ALL' ? this._reportService.getAllReports() : this._reportService.getReportsByStatus(filter);

    request$.subscribe({
      next: reports => {
        this.reports.set(reports);
        this.loading.set(false);
      },
      error: err => {
        this.error.set('Erreur lors du chargement des signalements');
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  onFilterChange(filter: string): void {
    this.filterOption.set(filter as FilterOption);
    this.loadReports();
  }

  viewDetail(report: Report): void {
    this.selectedReport.set(report);
    this.showDetailModal.set(true);
  }

  closeDetailModal(): void {
    this.showDetailModal.set(false);
    this.selectedReport.set(null);
  }

  updateStatus(report: Report, newStatus: ReportStatus): void {
    this.updatingStatus.set(true);

    this._reportService.updateReportStatus(report.id, newStatus).subscribe({
      next: updatedReport => {
        // Update in list
        const reports = this.reports();
        const index = reports.findIndex(r => r.id === report.id);
        if (index !== -1) {
          reports[index] = updatedReport;
          this.reports.set([...reports]);
        }
        // Update selected if same
        if (this.selectedReport()?.id === report.id) {
          this.selectedReport.set(updatedReport);
        }
        this.updatingStatus.set(false);
      },
      error: err => {
        console.error('Erreur lors de la mise à jour du statut:', err);
        this.updatingStatus.set(false);
      },
    });
  }

  getStatusClass(status: ReportStatus): string {
    switch (status) {
      case ReportStatus.PENDING:
        return 'status-pending';
      case ReportStatus.REVIEWED:
        return 'status-reviewed';
      case ReportStatus.RESOLVED:
        return 'status-resolved';
      case ReportStatus.DISMISSED:
        return 'status-dismissed';
      default:
        return '';
    }
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
