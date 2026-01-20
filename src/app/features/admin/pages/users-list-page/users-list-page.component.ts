import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { User } from '../../../user/models/user';

type SortOption = 'name-asc' | 'name-desc' | 'last-login-asc' | 'last-login-desc';

@Component({
  selector: 'app-users-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-list-page.component.html',
  styleUrl: './users-list-page.component.scss',
})
export class UsersListPageComponent implements OnInit {
  private _adminService = inject(AdminService);

  users = signal<User[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(10);

  // Sorting
  sortOption = signal<SortOption>('name-asc');

  // Computed: sorted users
  sortedUsers = computed(() => {
    const users = [...this.users()];
    const sort = this.sortOption();

    switch (sort) {
      case 'name-asc':
        return users.sort((a, b) => (a.userName || a.firstname || '').localeCompare(b.userName || b.firstname || ''));
      case 'name-desc':
        return users.sort((a, b) => (b.userName || b.firstname || '').localeCompare(a.userName || a.firstname || ''));
      case 'last-login-asc':
        return users.sort((a, b) => {
          if (!a.lastLoginAt) return 1;
          if (!b.lastLoginAt) return -1;
          return new Date(a.lastLoginAt).getTime() - new Date(b.lastLoginAt).getTime();
        });
      case 'last-login-desc':
        return users.sort((a, b) => {
          if (!a.lastLoginAt) return 1;
          if (!b.lastLoginAt) return -1;
          return new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime();
        });
      default:
        return users;
    }
  });

  // Computed: paginated users
  paginatedUsers = computed(() => {
    const sorted = this.sortedUsers();
    const page = this.currentPage();
    const perPage = this.itemsPerPage();
    const start = (page - 1) * perPage;
    return sorted.slice(start, start + perPage);
  });

  // Computed: total pages
  totalPages = computed(() => Math.ceil(this.sortedUsers().length / this.itemsPerPage()));

  // Profile modal state
  showProfileModal = signal(false);
  selectedUser = signal<User | null>(null);

  // Delete modal state
  showDeleteModal = signal(false);
  userToDelete = signal<User | null>(null);
  deleting = signal(false);

  // Mobile expanded cards
  expandedUserIds = signal<Set<number>>(new Set());

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    this._adminService.getAllUsers().subscribe({
      next: users => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: err => {
        this.error.set('Erreur lors du chargement des utilisateurs');
        this.loading.set(false);
        console.error(err);
      },
    });
  }

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
    this.goToPage(this.currentPage() - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  viewProfile(user: User): void {
    this.selectedUser.set(user);
    this.showProfileModal.set(true);
  }

  closeProfileModal(): void {
    this.showProfileModal.set(false);
    this.selectedUser.set(null);
  }

  confirmDelete(user: User): void {
    this.userToDelete.set(user);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.userToDelete.set(null);
  }

  deleteUser(): void {
    const user = this.userToDelete();
    if (!user) return;

    this.deleting.set(true);

    this._adminService.deleteUser(user.id).subscribe({
      next: () => {
        this.users.update(users => users.filter(u => u.id !== user.id));
        this.closeDeleteModal();
        this.deleting.set(false);
      },
      error: (err: unknown) => {
        console.error('Erreur lors de la suppression:', err);
        this.deleting.set(false);
      },
    });
  }

  toggleUserExpand(userId: number): void {
    this.expandedUserIds.update(ids => {
      const newSet = new Set(ids);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }

  isUserExpanded(userId: number): boolean {
    return this.expandedUserIds().has(userId);
  }

  formatLastLogin(lastLoginAt: string | undefined): string {
    if (!lastLoginAt) return 'Jamais';

    const date = new Date(lastLoginAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
