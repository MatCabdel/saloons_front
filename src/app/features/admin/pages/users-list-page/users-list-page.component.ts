import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { User } from '../../../user/models/user';

@Component({
  selector: 'app-users-list-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users-list-page.component.html',
  styleUrl: './users-list-page.component.scss',
})
export class UsersListPageComponent implements OnInit {
  private _adminService = inject(AdminService);

  users = signal<User[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Profile modal state
  showProfileModal = signal(false);
  selectedUser = signal<User | null>(null);

  // Delete modal state
  showDeleteModal = signal(false);
  userToDelete = signal<User | null>(null);
  deleting = signal(false);

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
}
