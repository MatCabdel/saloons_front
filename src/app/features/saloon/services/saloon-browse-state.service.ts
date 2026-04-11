import { Injectable, signal } from '@angular/core';
import {
  SALOON_FILTER_TABS,
  SaloonBrowseFilter,
} from '../models/saloon-browse.model';

@Injectable({ providedIn: 'root' })
export class SaloonBrowseStateService {
  readonly filterTabs = SALOON_FILTER_TABS;
  readonly activeFilter = signal<SaloonBrowseFilter>('ALL');
  readonly visibleSaloonCount = signal(0);

  setActiveFilter(filter: SaloonBrowseFilter): void {
    this.activeFilter.set(filter);
  }

  setVisibleSaloonCount(count: number): void {
    this.visibleSaloonCount.set(count);
  }
}
