import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PeriodRange } from '../../services/stats-api.service';

type PresetPeriod = '7d' | '30d' | '90d' | 'custom';

@Component({
  selector: 'app-period-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="period-filter">
      <div class="preset-buttons">
        <button
          type="button"
          *ngFor="let p of presets"
          [class.active]="selectedPreset === p.value"
          (click)="selectPreset(p.value)"
        >
          {{ p.label }}
        </button>
      </div>
      <div class="custom-range" *ngIf="selectedPreset === 'custom'">
        <input type="date" [(ngModel)]="customFrom" (change)="emitCustom()" />
        <span class="separator">→</span>
        <input type="date" [(ngModel)]="customTo" (change)="emitCustom()" />
      </div>
    </div>
  `,
  styles: [
    `
      .period-filter {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .preset-buttons {
        display: flex;
        gap: 0.5rem;
      }
      .preset-buttons button {
        padding: 0.4rem 1rem;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .preset-buttons button:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }
      .preset-buttons button.active {
        background: rgba(255, 193, 34, 0.2);
        border-color: rgba(255, 193, 34, 0.5);
        color: #ffc122;
        font-weight: 600;
      }
      .custom-range {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .custom-range input {
        padding: 0.4rem 0.75rem;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
        color: white;
        font-size: 0.85rem;
      }
      .custom-range input::-webkit-calendar-picker-indicator {
        filter: invert(1);
      }
      .separator {
        color: rgba(255, 255, 255, 0.4);
      }
      @media (max-width: 768px) {
        .period-filter {
          flex-direction: column;
          align-items: flex-start;
        }
        .preset-buttons {
          flex-wrap: wrap;
        }
        .preset-buttons button {
          padding: 0.35rem 0.75rem;
          font-size: 0.8rem;
        }
      }
    `,
  ],
})
export class PeriodFilterComponent implements OnInit {
  @Output() periodChange = new EventEmitter<PeriodRange>();

  presets: { label: string; value: PresetPeriod }[] = [
    { label: '7 jours', value: '7d' },
    { label: '30 jours', value: '30d' },
    { label: '90 jours', value: '90d' },
    { label: 'Personnalisé', value: 'custom' },
  ];

  selectedPreset: PresetPeriod = '30d';
  customFrom = '';
  customTo = '';

  constructor() {
    // Initialize with default period
    const now = new Date();
    this.customTo = this._formatDate(now);
    const from = new Date();
    from.setDate(from.getDate() - 30);
    this.customFrom = this._formatDate(from);
  }

  ngOnInit(): void {
    this.selectPreset('30d');
  }

  selectPreset(preset: PresetPeriod): void {
    this.selectedPreset = preset;
    if (preset === 'custom') return;

    const to = new Date();
    const from = new Date();
    switch (preset) {
      case '7d':
        from.setDate(from.getDate() - 7);
        break;
      case '30d':
        from.setDate(from.getDate() - 30);
        break;
      case '90d':
        from.setDate(from.getDate() - 90);
        break;
    }
    this.customFrom = this._formatDate(from);
    this.customTo = this._formatDate(to);
    this.periodChange.emit({ from: this.customFrom, to: this.customTo });
  }

  emitCustom(): void {
    if (this.customFrom && this.customTo) {
      this.periodChange.emit({ from: this.customFrom, to: this.customTo });
    }
  }

  private _formatDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }
}
