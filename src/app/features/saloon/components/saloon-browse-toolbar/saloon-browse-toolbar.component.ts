import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';
import { SaloonBrowseStateService } from '../../services/saloon-browse-state.service';
import { SaloonBrowseFilter } from '../../models/saloon-browse.model';
import { SwitchListMapComponent } from 'src/app/common/components/switch-list-map/switch-list-map.component';

@Component({
  selector: 'app-saloon-browse-toolbar',
  standalone: true,
  imports: [CommonModule, SwitchListMapComponent],
  templateUrl: './saloon-browse-toolbar.component.html',
  styleUrl: './saloon-browse-toolbar.component.scss',
})
export class SaloonBrowseToolbarComponent implements AfterViewInit, OnInit, OnDestroy {
  private _browseState = inject(SaloonBrowseStateService);
  private _router = inject(Router);
  private _destroy$ = new Subject<void>();

  readonly filterTabs = this._browseState.filterTabs;
  readonly activeFilter = this._browseState.activeFilter;
  readonly visibleSaloonCount = this._browseState.visibleSaloonCount;
  readonly filtersScrollHint = signal<'end' | 'start' | 'none'>('end');
  readonly summaryLabel = signal('Saloons à proximité');

  @ViewChild('filtersScroller') private _filtersScroller?: ElementRef<HTMLDivElement>;

  ngOnInit(): void {
    this._syncSummaryLabel(this._router.url);
    this._router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this._destroy$)
      )
      .subscribe(event => this._syncSummaryLabel(event.urlAfterRedirects));
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this._syncFiltersScrollHint());
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this._syncFiltersScrollHint();
  }

  setFilter(filter: SaloonBrowseFilter): void {
    this._browseState.setActiveFilter(filter);
  }

  onFiltersScroll(scroller: HTMLDivElement): void {
    this._updateFiltersScrollHint(scroller);
  }

  private _syncFiltersScrollHint(): void {
    if (this._filtersScroller) {
      this._updateFiltersScrollHint(this._filtersScroller.nativeElement);
    }
  }

  private _syncSummaryLabel(url: string): void {
    this.summaryLabel.set(url.includes('/map') ? 'Saloons dans cette zone' : 'Saloons à proximité');
  }

  private _updateFiltersScrollHint(scroller: HTMLDivElement): void {
    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;

    if (maxScrollLeft <= 2) {
      this.filtersScrollHint.set('none');
      return;
    }

    this.filtersScrollHint.set(scroller.scrollLeft >= maxScrollLeft - 4 ? 'start' : 'end');
  }
}
