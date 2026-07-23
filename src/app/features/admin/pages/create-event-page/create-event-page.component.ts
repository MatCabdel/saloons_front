import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { Saloon } from '../../../saloon/models/saloonModel';

@Component({
  selector: 'app-create-event-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-event-page.component.html',
  styleUrl: './create-event-page.component.scss',
})
export class CreateEventPageComponent implements OnInit {
  private _fb = inject(FormBuilder);
  private _adminService = inject(AdminService);
  private _router = inject(Router);

  isLoading = false;
  error: string | null = null;
  success = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  saloons: Saloon[] = [];

  eventForm: FormGroup = this._fb.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    subTitle: [''],
    description: [''],
    startDateTime: ['', Validators.required],
    saloonId: [null, Validators.required],
    radiusMeters: [25000, [Validators.min(10), Validators.max(100000)]],
    radiusUnlimited: [false],
  });

  get radiusUnlimited(): boolean {
    return this.eventForm.get('radiusUnlimited')?.value === true;
  }

  ngOnInit(): void {
    this._adminService.getAllSaloons().subscribe({
      next: saloons => {
        this.saloons = saloons;
      },
      error: () => {
        this.error = 'Impossible de charger la liste des saloons';
      },
    });
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
    if (this.eventForm.invalid || !this.selectedFile) {
      this.eventForm.markAllAsTouched();
      if (!this.selectedFile) {
        this.error = 'Veuillez sélectionner une image';
      }
      return;
    }

    this.isLoading = true;
    this.error = null;

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('title', this.eventForm.get('title')?.value);
    formData.append('subTitle', this.eventForm.get('subTitle')?.value || '');
    formData.append('description', this.eventForm.get('description')?.value || '');
    formData.append('startDateTime', this.eventForm.get('startDateTime')?.value);
    formData.append('saloonId', this.eventForm.get('saloonId')?.value);
    formData.append('radiusUnlimited', this.radiusUnlimited ? 'true' : 'false');
    if (!this.radiusUnlimited) {
      formData.append('radiusMeters', this.eventForm.get('radiusMeters')?.value || '25000');
    }

    this._adminService.createEventWithImage(formData).subscribe({
      next: () => {
        this.success = true;
        this.isLoading = false;
        setTimeout(() => {
          this._router.navigate(['dashboard', 'events-list']);
        }, 1500);
      },
      error: err => {
        this.error = err.error?.message || "Erreur lors de la création de l'événement";
        this.isLoading = false;
      },
    });
  }

  resetForm(): void {
    this.eventForm.reset({
      radiusMeters: 25000,
      radiusUnlimited: false,
    });
    this.selectedFile = null;
    this.imagePreview = null;
    this.error = null;
    this.success = false;
  }
}
