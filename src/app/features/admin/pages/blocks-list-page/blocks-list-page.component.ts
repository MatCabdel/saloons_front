import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlockService, BlockedUserDTO } from 'src/app/features/block/services/block.service';

@Component({
  selector: 'app-blocks-list-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './blocks-list-page.component.html',
  styleUrl: './blocks-list-page.component.scss',
})
export class BlocksListPageComponent implements OnInit {
  private _blockService = inject(BlockService);

  blocks = signal<BlockedUserDTO[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadBlocks();
  }

  loadBlocks(): void {
    this.loading.set(true);
    this.error.set(null);

    this._blockService.getAllBlocks().subscribe({
      next: blocks => {
        this.blocks.set(blocks);
        this.loading.set(false);
      },
      error: err => {
        this.error.set('Erreur lors du chargement des blocages');
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
