import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../services/report.service';
import { CreateReportDTO, ReportReason, REPORT_REASON_LABELS } from '../../models/report.model';

export type ReportModalData = {
  reportedId: number;
  reportedUserName: string;
  saloonId?: number;
  saloonName?: string;
};

@Component({
  selector: 'app-report-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-modal.component.html',
  styleUrl: './report-modal.component.scss',
})
export class ReportModalComponent {
  private _reportService = inject(ReportService);

  @Input() data!: ReportModalData;
  @Output() closed = new EventEmitter<void>();
  @Output() reported = new EventEmitter<void>();

  selectedReason = signal<ReportReason | null>(null);
  description = signal<string>('');
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Liste des raisons disponibles
  readonly reasons: { value: ReportReason; label: string }[] = Object.entries(REPORT_REASON_LABELS).map(([value, label]) => ({
    value: value as ReportReason,
    label,
  }));

  close(): void {
    this.closed.emit();
  }

  selectReason(reason: ReportReason): void {
    this.selectedReason.set(reason);
    this.errorMessage.set(null);
  }

  onDescriptionChange(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.description.set(textarea.value);
  }

  submitReport(): void {
    const reason = this.selectedReason();
    if (!reason) {
      this.errorMessage.set('Veuillez sélectionner une raison.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const reportData: CreateReportDTO = {
      reportedId: this.data.reportedId,
      reason,
      description: this.description() || undefined,
      saloonId: this.data.saloonId,
    };

    this._reportService.createReport(reportData).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set('Signalement envoyé avec succès. Notre équipe va examiner votre demande.');
        setTimeout(() => {
          this.reported.emit();
          this.close();
        }, 2000);
      },
      error: err => {
        this.isSubmitting.set(false);
        if (err.status === 409) {
          this.errorMessage.set('Vous avez déjà signalé cet utilisateur récemment.');
        } else {
          this.errorMessage.set('Une erreur est survenue. Veuillez réessayer.');
        }
      },
    });
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}
