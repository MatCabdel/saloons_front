import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminService, PaginationParams, PagedResponse } from '../../services/admin.service';
import { EventItem } from '../../../event/models/event.model';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-events-list-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './events-list-page.component.html',
  styleUrl: './events-list-page.component.scss',
})
export class EventsListPageComponent implements OnInit {
  private _adminService = inject(AdminService);
  private _router = inject(Router);

  events = signal<EventItem[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal(0);
  pageSize = signal(10);
  totalElements = signal(0);
  totalPages = signal(0);

  // Tri et recherche
  sortBy = signal('startDateTime');
  sortDir = signal<'asc' | 'desc'>('desc');
  searchQuery = signal('');
  private _searchSubject = new Subject<string>();

  // Modal de confirmation de suppression
  showDeleteModal = false;
  eventToDelete: EventItem | null = null;

  ngOnInit(): void {
    this._searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(query => {
      this.searchQuery.set(query);
      this.currentPage.set(0);
      this.loadEvents();
    });

    this.loadEvents();
  }

  loadEvents(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const params: PaginationParams = {
      page: this.currentPage(),
      size: this.pageSize(),
      sortBy: this.sortBy(),
      sortDir: this.sortDir(),
      search: this.searchQuery() || undefined,
    };

    this._adminService.getEventsPaginated(params).subscribe({
      next: (response: PagedResponse<EventItem>) => {
        this.events.set(response.content);
        this.totalElements.set(response.totalElements);
        this.totalPages.set(response.totalPages);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Erreur lors du chargement des événements');
        this.isLoading.set(false);
      },
    });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this._searchSubject.next(value);
  }

  toggleSort(field: string): void {
    if (this.sortBy() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortDir.set('asc');
    }
    this.loadEvents();
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadEvents();
  }

  editEvent(event: EventItem): void {
    this._router.navigate(['dashboard', 'edit-event', event.id]);
  }

  createEvent(): void {
    this._router.navigate(['dashboard', 'create-event']);
  }

  confirmDelete(event: EventItem): void {
    this.eventToDelete = event;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.eventToDelete = null;
  }

  deleteEvent(): void {
    if (!this.eventToDelete) return;
    this._adminService.deleteEvent(this.eventToDelete.id).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.eventToDelete = null;
        this.loadEvents();
      },
      error: () => {
        this.error.set("Erreur lors de la suppression de l'événement");
        this.showDeleteModal = false;
      },
    });
  }

  toggleActive(event: EventItem): void {
    this._adminService.toggleEventActive(event.id).subscribe({
      next: () => {
        this.loadEvents();
      },
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
