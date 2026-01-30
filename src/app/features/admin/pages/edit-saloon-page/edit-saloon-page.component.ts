import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { Saloon, SALOON_TYPE_LABELS, SaloonType } from '../../../saloon/models/saloonModel';

@Component({
  selector: 'app-edit-saloon-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-saloon-page.component.html',
  styleUrl: './edit-saloon-page.component.scss',
})
export class EditSaloonPageComponent implements OnInit {
  private _fb = inject(FormBuilder);
  private _adminService = inject(AdminService);
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);

  saloonId: number | null = null;
  saloon: Saloon | null = null;
  isLoading = true;
  isSaving = false;
  error: string | null = null;
  success = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  originalImageUrl: string | null = null;

  saloonTypes: { value: SaloonType; label: string }[] = Object.entries(SALOON_TYPE_LABELS).map(
    ([value, label]) => ({
      value: value as SaloonType,
      label,
    })
  );

  saloonForm: FormGroup = this._fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    address: [''],
    city: [''],
    country: ['France'],
    latitude: [null, [Validators.required, Validators.min(-90), Validators.max(90)]],
    longitude: [null, [Validators.required, Validators.min(-180), Validators.max(180)]],
    radiusMeters: [100, [Validators.min(10), Validators.max(100000)]],
    type: ['BAR', Validators.required],
    isPrivate: [false],
  });

  ngOnInit(): void {
    const idParam = this._route.snapshot.paramMap.get('id');
    if (idParam) {
      this.saloonId = parseInt(idParam, 10);
      this.loadSaloon();
    } else {
      this.error = 'ID du saloon non fourni';
      this.isLoading = false;
    }
  }

  loadSaloon(): void {
    if (!this.saloonId) return;

    this._adminService.getSaloonById(this.saloonId).subscribe({
      next: (saloon: Saloon) => {
        this.saloon = saloon;
        this.originalImageUrl = saloon.imgUrl;
        this.imagePreview = saloon.imgUrl;

        this.saloonForm.patchValue({
          name: saloon.name,
          address: saloon.address || '',
          city: saloon.city || '',
          country: 'France',
          latitude: saloon.latitude,
          longitude: saloon.longitude,
          radiusMeters: saloon.radiusMeters || 100,
          type: saloon.type || 'BAR',
          isPrivate: saloon.isPrivate ?? false,
        });

        this.isLoading = false;
      },
      error: (err: unknown) => {
        this.error = 'Erreur lors du chargement du saloon';
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.error = "L'image ne doit pas dépasser 10MB";
        return;
      }

      // Vérifier le type
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
    if (this.saloonForm.invalid || !this.saloonId) {
      this.saloonForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.error = null;

    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('name', this.saloonForm.get('name')?.value);
      formData.append('address', this.saloonForm.get('address')?.value || '');
      formData.append('city', this.saloonForm.get('city')?.value || '');
      formData.append('country', this.saloonForm.get('country')?.value || 'France');
      formData.append('latitude', this.saloonForm.get('latitude')?.value);
      formData.append('longitude', this.saloonForm.get('longitude')?.value);
      formData.append('radiusMeters', this.saloonForm.get('radiusMeters')?.value || '100');
      formData.append('type', this.saloonForm.get('type')?.value || 'BAR');
      formData.append('isPrivate', this.saloonForm.get('isPrivate')?.value ? 'true' : 'false');

      this._adminService.updateSaloonWithImage(this.saloonId, formData).subscribe({
        next: () => {
          this.success = true;
          this.isSaving = false;
          setTimeout(() => {
            this._router.navigate(['dashboard', 'saloons-list']);
          }, 1500);
        },
        error: (err: { error?: { message?: string } }) => {
          this.error = err.error?.message || 'Erreur lors de la mise à jour du saloon';
          this.isSaving = false;
        },
      });
    } else {
      const saloonData = {
        name: this.saloonForm.get('name')?.value,
        imgUrl: this.originalImageUrl || '',
        address: this.saloonForm.get('address')?.value || '',
        city: this.saloonForm.get('city')?.value || '',
        country: this.saloonForm.get('country')?.value || 'France',
        latitude: this.saloonForm.get('latitude')?.value,
        longitude: this.saloonForm.get('longitude')?.value,
        radiusMeters: this.saloonForm.get('radiusMeters')?.value || 100,
        type: this.saloonForm.get('type')?.value || 'BAR',
        isPrivate: this.saloonForm.get('isPrivate')?.value || false,
      };

      this._adminService.updateSaloon(this.saloonId, saloonData).subscribe({
        next: () => {
          this.success = true;
          this.isSaving = false;
          setTimeout(() => {
            this._router.navigate(['dashboard', 'saloons-list']);
          }, 1500);
        },
        error: (err: { error?: { message?: string } }) => {
          this.error = err.error?.message || 'Erreur lors de la mise à jour du saloon';
          this.isSaving = false;
        },
      });
    }
  }

  resetForm(): void {
    if (this.saloon) {
      this.saloonForm.patchValue({
        name: this.saloon.name,
        address: this.saloon.address || '',
        city: this.saloon.city || '',
        country: 'France',
        latitude: this.saloon.latitude,
        longitude: this.saloon.longitude,
        radiusMeters: this.saloon.radiusMeters || 100,
        type: this.saloon.type || 'BAR',
        isPrivate: this.saloon.isPrivate ?? false,
      });
      this.selectedFile = null;
      this.imagePreview = this.originalImageUrl;
      this.error = null;
    }
  }

  goBack(): void {
    this._router.navigate(['dashboard', 'saloons-list']);
  }
}
