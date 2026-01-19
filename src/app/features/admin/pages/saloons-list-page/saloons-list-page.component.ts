import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { Saloon } from '../../../saloon/models/saloonModel';
import { User } from '../../../user/models/user';

@Component({
  selector: 'app-saloons-list-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './saloons-list-page.component.html',
  styleUrl: './saloons-list-page.component.scss',
})
export class SaloonsListPageComponent implements OnInit {
  private _adminService = inject(AdminService);

  saloons: Saloon[] = [];
  isLoading = true;
  error: string | null = null;

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
        this.saloons = data || [];
        this.isLoading = false;
      },
      error: err => {
        this.error = 'Erreur lors du chargement des saloons';
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  toggleActive(saloon: Saloon): void {
    this._adminService.toggleSaloonActive(saloon.id).subscribe({
      next: updated => {
        const index = this.saloons.findIndex(s => s.id === saloon.id);
        if (index !== -1) {
          this.saloons[index] = { ...this.saloons[index], ...updated };
        }
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
        this.saloons = this.saloons.filter(s => s.id !== saloon.id);
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
