import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, PagedResponse } from '../../services/admin.service';
import { User } from '../../../user/models/user';
import { VersionedImageUrlPipe } from 'src/app/common/pipes/versioned-image-url.pipe';

type SortOption =
  | 'name-asc'
  | 'name-desc'
  | 'last-login-asc'
  | 'last-login-desc'
  | 'created-at-asc'
  | 'created-at-desc';

@Component({
  selector: 'app-users-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, VersionedImageUrlPipe],
  templateUrl: './users-list-page.component.html',
  styleUrl: './users-list-page.component.scss',
})
export class UsersListPageComponent implements OnInit {
  private _adminService = inject(AdminService);

  // Users from server (already paginated and sorted)
  users = signal<User[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

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

  // Profile modal state
  showProfileModal = signal(false);
  selectedUser = signal<User | null>(null);

  // Delete modal state
  showDeleteModal = signal(false);
  userToDelete = signal<User | null>(null);
  deleting = signal(false);

  // Active/inactive modal state
  showActiveModal = signal(false);
  userToToggleActive = signal<User | null>(null);
  togglingActive = signal(false);

  // Role update state
  updatingUserRoles = signal<Set<number>>(new Set());
  pendingUserRoles = signal<Map<number, string>>(new Map());

  // Mobile expanded cards
  expandedUserIds = signal<Set<number>>(new Set());

  readonly roleOptions = [
    { label: 'user', value: 'ROLE_USER' },
    { label: 'reviewer', value: 'ROLE_REVIEWER' },
    { label: 'admin', value: 'ROLE_ADMIN' },
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(showLoading = true): void {
    if (showLoading) {
      this.loading.set(true);
    }
    this.error.set(null);

    const sort = this.sortOption();
    let sortBy = 'userName';
    if (sort.startsWith('last-login')) {
      sortBy = 'lastLoginAt';
    } else if (sort.startsWith('created-at')) {
      sortBy = 'createdAt';
    }
    const sortDir = sort.endsWith('-desc') ? 'desc' : 'asc';
    const search = this.searchQuery().trim();

    this._adminService
      .getUsersPaginated({
        page: this.currentPage() - 1, // Backend uses 0-based pages
        size: this.itemsPerPage(),
        sortBy,
        sortDir,
        ...(search && { search }),
      })
      .subscribe({
        next: (response: PagedResponse<User>) => {
          this.users.set(response.content);
          this.totalPages.set(response.totalPages);
          this.totalElements.set(response.totalElements);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.error.set('Erreur lors du chargement des utilisateurs');
          this.loading.set(false);
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
      this.loadUsers(false);
    }, 500);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.currentPage.set(1);
    this.loadUsers();
  }

  onSortChange(sort: string): void {
    this.sortOption.set(sort as SortOption);
    this.currentPage.set(1);
    this.loadUsers();
  }

  onItemsPerPageChange(value: number): void {
    this.itemsPerPage.set(value);
    this.currentPage.set(1);
    this.loadUsers();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadUsers();
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

  isUserActive(user: User): boolean {
    return user.isActive !== false;
  }

  confirmToggleActive(user: User): void {
    this.userToToggleActive.set(user);
    this.showActiveModal.set(true);
  }

  closeActiveModal(): void {
    this.showActiveModal.set(false);
    this.userToToggleActive.set(null);
  }

  toggleActiveUser(): void {
    const user = this.userToToggleActive();
    if (!user) return;

    this.togglingActive.set(true);

    this._adminService.toggleUserActive(user.id).subscribe({
      next: updatedUser => {
        this.users.update(users =>
          users.map(u => (u.id === user.id ? { ...u, ...updatedUser } : u))
        );
        this.closeActiveModal();
        this.togglingActive.set(false);
      },
      error: (err: unknown) => {
        console.error("Erreur lors du changement d'état du compte:", err);
        this.togglingActive.set(false);
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

  formatCreatedAt(createdAt: string | undefined): string {
    if (!createdAt) return '-';
    const date = new Date(createdAt);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  togglePremium(user: User): void {
    this._adminService.toggleUserPremium(user.id).subscribe({
      next: response => {
        this.users.update(users =>
          users.map(u => (u.id === user.id ? { ...u, isPremium: response.isPremium } : u))
        );
      },
      error: (err: unknown) => {
        console.error('Erreur lors du toggle premium:', err);
      },
    });
  }

  getSelectedRole(user: User): string {
    return this.pendingUserRoles().get(user.id) ?? user.role ?? 'ROLE_USER';
  }

  hasPendingRole(user: User): boolean {
    return this.getSelectedRole(user) !== (user.role ?? 'ROLE_USER');
  }

  onRoleSelectionChange(user: User, role: string): void {
    if (!role) {
      return;
    }
    this.pendingUserRoles.update(roles => {
      const next = new Map(roles);
      if (role === (user.role ?? 'ROLE_USER')) {
        next.delete(user.id);
      } else {
        next.set(user.id, role);
      }
      return next;
    });
  }

  saveUserRole(user: User): void {
    const role = this.getSelectedRole(user);
    if (!this.hasPendingRole(user)) {
      return;
    }

    this.updatingUserRoles.update(ids => new Set(ids).add(user.id));

    this._adminService.updateUserRole(user.id, role).subscribe({
      next: updatedUser => {
        this.users.update(users =>
          users.map(u => (u.id === user.id ? { ...u, role: updatedUser.role } : u))
        );
        this.pendingUserRoles.update(roles => {
          const next = new Map(roles);
          next.delete(user.id);
          return next;
        });
        this.updatingUserRoles.update(ids => {
          const next = new Set(ids);
          next.delete(user.id);
          return next;
        });
      },
      error: (err: unknown) => {
        console.error('Erreur lors de la mise à jour du rôle:', err);
        this.updatingUserRoles.update(ids => {
          const next = new Set(ids);
          next.delete(user.id);
          return next;
        });
      },
    });
  }

  isUpdatingRole(userId: number): boolean {
    return this.updatingUserRoles().has(userId);
  }
}
