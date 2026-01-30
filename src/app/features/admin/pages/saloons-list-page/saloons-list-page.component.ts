import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService, PagedResponse } from '../../services/admin.service';
import { Saloon, SALOON_TYPE_LABELS, SaloonType } from '../../../saloon/models/saloonModel';
import { User } from '../../../user/models/user';

type SortOption = 'name-asc' | 'name-desc' | 'connected-desc' | 'connected-asc';

@Component({
  selector: 'app-saloons-list-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './saloons-list-page.component.html',
  styleUrl: './saloons-list-page.component.scss',
})
export class SaloonsListPageComponent implements OnInit {
  private _adminService = inject(AdminService);

  // Saloons from server (already paginated and sorted)
  saloons = signal<Saloon[]>([]);
  isLoading = true;
  error: string | null = null;

  // Pagination (server-side)
  currentPage = signal(1);
  itemsPerPage = signal(10);
  totalPages = signal(1);
  totalElements = signal(0);

  // Sorting
  sortOption = signal<SortOption>('name-asc');

  // Search
  searchQuery = signal('');
  private _searchTimeout: ReturnType<typeof setTimeout> | null = null;

  // Modal state
  showUsersModal = false;
  selectedSaloon: Saloon | null = null;
  saloonUsers: User[] = [];
  loadingUsers = false;

  // Delete modal state
  showDeleteModal = signal(false);
  saloonToDelete = signal<Saloon | null>(null);
  deleting = signal(false);

  // Mobile expanded cards
  expandedSaloonIds = signal<Set<number>>(new Set());

  ngOnInit(): void {
    this.loadSaloons();
  }

  loadSaloons(showLoading = true): void {
    if (showLoading) {
      this.isLoading = true;
    }
    this.error = null;

    const sort = this.sortOption();
    const sortBy = sort.startsWith('connected') ? 'connectedCount' : 'name';
    const sortDir = sort.endsWith('-desc') ? 'desc' : 'asc';
    const search = this.searchQuery().trim();

    this._adminService
      .getSaloonsPaginated({
        page: this.currentPage() - 1, // Backend uses 0-based pages
        size: this.itemsPerPage(),
        sortBy,
        sortDir,
        ...(search && { search }),
      })
      .subscribe({
        next: (response: PagedResponse<Saloon>) => {
          this.saloons.set(response.content || []);
          this.totalPages.set(response.totalPages);
          this.totalElements.set(response.totalElements);
          this.isLoading = false;
        },
        error: (err: unknown) => {
          this.error = 'Erreur lors du chargement des saloons';
          this.isLoading = false;
          console.error(err);
        },
      });
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);

    // Debounce search to avoid too many API calls
    if (this._searchTimeout) {
      clearTimeout(this._searchTimeout);
    }
    this._searchTimeout = setTimeout(() => {
      this.currentPage.set(1);
      // Don't show loading spinner during search to avoid disrupting input
      this.loadSaloons(false);
    }, 500);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.currentPage.set(1);
    this.loadSaloons();
  }

  // Pagination methods
  onSortChange(sort: string): void {
    this.sortOption.set(sort as SortOption);
    this.currentPage.set(1);
    this.loadSaloons();
  }

  onItemsPerPageChange(value: number): void {
    this.itemsPerPage.set(value);
    this.currentPage.set(1);
    this.loadSaloons();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadSaloons();
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadSaloons();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadSaloons();
    }
  }

  toggleActive(saloon: Saloon): void {
    this._adminService.toggleSaloonActive(saloon.id).subscribe({
      next: updated => {
        this.saloons.update(list => {
          const index = list.findIndex(s => s.id === saloon.id);
          if (index !== -1) {
            const newList = [...list];
            newList[index] = { ...list[index], ...updated };
            return newList;
          }
          return list;
        });
      },
      error: err => {
        console.error('Erreur toggle active:', err);
      },
    });
  }

  togglePrivate(saloon: Saloon): void {
    this._adminService.toggleSaloonPrivate(saloon.id).subscribe({
      next: updated => {
        this.saloons.update(list => {
          const index = list.findIndex(s => s.id === saloon.id);
          if (index !== -1) {
            const newList = [...list];
            newList[index] = { ...list[index], ...updated };
            return newList;
          }
          return list;
        });
      },
      error: err => {
        console.error('Erreur toggle private:', err);
      },
    });
  }

  confirmDeleteSaloon(saloon: Saloon): void {
    this.saloonToDelete.set(saloon);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.saloonToDelete.set(null);
  }

  deleteSaloon(): void {
    const saloon = this.saloonToDelete();
    if (!saloon) return;

    this.deleting.set(true);

    this._adminService.deleteSaloon(saloon.id).subscribe({
      next: () => {
        this.saloons.update(list => list.filter(s => s.id !== saloon.id));
        this.closeDeleteModal();
        this.deleting.set(false);
      },
      error: (err: unknown) => {
        console.error('Erreur suppression:', err);
        this.deleting.set(false);
      },
    });
  }

  viewUsers(saloon: Saloon): void {
    this.selectedSaloon = saloon;
    this.showUsersModal = true;
    this.loadingUsers = true;
    this.saloonUsers = [];

    this._adminService.getSaloonUsers(saloon.id).subscribe({
      next: users => {
        this.saloonUsers = users;
        this.loadingUsers = false;
      },
      error: err => {
        console.error('Erreur chargement utilisateurs:', err);
        this.loadingUsers = false;
      },
    });
  }

  closeModal(): void {
    this.showUsersModal = false;
    this.selectedSaloon = null;
    this.saloonUsers = [];
  }

  toggleSaloonExpand(saloonId: number): void {
    this.expandedSaloonIds.update(ids => {
      const newSet = new Set(ids);
      if (newSet.has(saloonId)) {
        newSet.delete(saloonId);
      } else {
        newSet.add(saloonId);
      }
      return newSet;
    });
  }

  isSaloonExpanded(saloonId: number): boolean {
    return this.expandedSaloonIds().has(saloonId);
  }

  getTypeLabel(type: SaloonType | undefined): string {
    if (!type) return '-';
    return SALOON_TYPE_LABELS[type] || type;
  }
}
