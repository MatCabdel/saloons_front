import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { Saloon } from '../../../saloon/models/saloonModel';
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

  saloons = signal<Saloon[]>([]);
  isLoading = true;
  error: string | null = null;

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(10);
  sortOption = signal<SortOption>('name-asc');

  // Computed for sorted saloons
  sortedSaloons = computed(() => {
    const saloonsList = [...this.saloons()];
    const sort = this.sortOption();

    return saloonsList.sort((a, b) => {
      if (sort === 'name-asc') {
        return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
      }
      if (sort === 'name-desc') {
        return (b.name || '').toLowerCase().localeCompare((a.name || '').toLowerCase());
      }
      if (sort === 'connected-desc') {
        return (b.connectedCount || 0) - (a.connectedCount || 0);
      }
      return (a.connectedCount || 0) - (b.connectedCount || 0);
    });
  });

  // Computed for paginated saloons
  paginatedSaloons = computed(() => {
    const sorted = this.sortedSaloons();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return sorted.slice(start, end);
  });

  // Total pages
  totalPages = computed(() => {
    return Math.ceil(this.saloons().length / this.itemsPerPage()) || 1;
  });

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

  loadSaloons(): void {
    this.isLoading = true;
    this._adminService.getAllSaloons().subscribe({
      next: data => {
        this.saloons.set(data || []);
        this.isLoading = false;
      },
      error: err => {
        this.error = 'Erreur lors du chargement des saloons';
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  // Pagination methods
  onSortChange(sort: string): void {
    this.sortOption.set(sort as SortOption);
    this.currentPage.set(1);
  }

  onItemsPerPageChange(value: number): void {
    this.itemsPerPage.set(value);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
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
}
