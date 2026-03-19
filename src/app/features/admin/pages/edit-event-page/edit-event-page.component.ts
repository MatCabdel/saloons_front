import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { Saloon } from '../../../saloon/models/saloonModel';
import { EventItem } from '../../../event/models/event.model';

@Component({
  selector: 'app-edit-event-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-event-page.component.html',
  styleUrl: './edit-event-page.component.scss',
})
export class EditEventPageComponent implements OnInit {
  private _fb = inject(FormBuilder);
  private _adminService = inject(AdminService);
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);

  eventId: number | null = null;
  event: EventItem | null = null;
  saloons: Saloon[] = [];
  isLoading = true;
  isSaving = false;
  error: string | null = null;
  success = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  originalImageUrl: string | null = null;

  eventForm: FormGroup = this._fb.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    subTitle: ['', [Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(2000)]],
    startDateTime: ['', Validators.required],
    saloonId: [null, Validators.required],
  });

  ngOnInit(): void {
    const idParam = this._route.snapshot.paramMap.get('id');
    if (idParam) {
      this.eventId = parseInt(idParam, 10);
      this.loadData();
    } else {
      this.error = "ID de l'événement non fourni";
      this.isLoading = false;
    }
  }

  loadData(): void {
    // Load saloons list first
    this._adminService.getAllSaloons().subscribe({
      next: (saloons: Saloon[]) => {
        this.saloons = saloons;
        this.loadEvent();
      },
      error: () => {
        this.error = 'Erreur lors du chargement des saloons';
        this.isLoading = false;
      },
    });
  }

  loadEvent(): void {
    if (!this.eventId) return;

    this._adminService.getEventById(this.eventId).subscribe({
      next: (event: EventItem) => {
        this.event = event;
        this.originalImageUrl = event.imageUrl;
        this.imagePreview = event.imageUrl;

        this.eventForm.patchValue({
          title: event.title,
          subTitle: event.subTitle || '',
          description: event.description || '',
          startDateTime: this.toDatetimeLocal(event.startDateTime),
          saloonId: event.saloonId,
        });

        this.isLoading = false;
      },
      error: () => {
        this.error = "Erreur lors du chargement de l'événement";
        this.isLoading = false;
      },
    });
  }

  toDatetimeLocal(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const pad = (n: number): string => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
      date.getHours()
    )}:${pad(date.getMinutes())}`;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      if (file.size > 10 * 1024 * 1024) {
        this.error = "L'image ne doit pas dépasser 10MB";
        return;
      }

      if (!file.type.startsWith('image/')) {
        this.error = 'Le fichier doit être une image';
        return;
      }

      this.selectedFile = file;
      this.imagePreview = URL.createObjectURL(file);
      this.error = null;
    }
  }

  onSubmit(): void {
    if (this.eventForm.invalid || !this.eventId) {
      this.eventForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.error = null;

    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('title', this.eventForm.get('title')?.value);
      formData.append('subTitle', this.eventForm.get('subTitle')?.value || '');
      formData.append('description', this.eventForm.get('description')?.value || '');
      formData.append('startDateTime', this.eventForm.get('startDateTime')?.value);
      formData.append('saloonId', this.eventForm.get('saloonId')?.value);

      this._adminService.updateEventWithImage(this.eventId, formData).subscribe({
        next: () => this._onSuccess(),
        error: (err: { error?: { message?: string } }) => this._onError(err),
      });
    } else {
      const eventData = {
        title: this.eventForm.get('title')?.value,
        subTitle: this.eventForm.get('subTitle')?.value || '',
        imageUrl: this.originalImageUrl || '',
        description: this.eventForm.get('description')?.value || '',
        startDateTime: this.eventForm.get('startDateTime')?.value,
        saloonId: this.eventForm.get('saloonId')?.value,
      };

      this._adminService.updateEvent(this.eventId, eventData).subscribe({
        next: () => this._onSuccess(),
        error: (err: { error?: { message?: string } }) => this._onError(err),
      });
    }
  }

  private _onSuccess(): void {
    this.success = true;
    this.isSaving = false;
    setTimeout(() => {
      this._router.navigate(['dashboard', 'events-list']);
    }, 1500);
  }

  private _onError(err: { error?: { message?: string } }): void {
    this.error = err.error?.message || "Erreur lors de la mise à jour de l'événement";
    this.isSaving = false;
  }

  resetForm(): void {
    if (this.event) {
      this.eventForm.patchValue({
        title: this.event.title,
        subTitle: this.event.subTitle || '',
        description: this.event.description || '',
        startDateTime: this.toDatetimeLocal(this.event.startDateTime),
        saloonId: this.event.saloonId,
      });
      this.selectedFile = null;
      this.imagePreview = this.originalImageUrl;
      this.error = null;
    }
  }

  goBack(): void {
    this._router.navigate(['dashboard', 'events-list']);
  }
}
