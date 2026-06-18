import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { SALOON_TYPE_LABELS, SaloonType } from '../../../saloon/models/saloonModel';

@Component({
  selector: 'app-create-saloon-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-saloon-page.component.html',
  styleUrl: './create-saloon-page.component.scss',
})
export class CreateSaloonPageComponent {
  private _fb = inject(FormBuilder);
  private _adminService = inject(AdminService);
  private _router = inject(Router);

  isLoading = false;
  error: string | null = null;
  success = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;

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
    radiusUnlimited: [false],
    type: ['BAR', Validators.required],
    isPrivate: [false],
  });

  get radiusUnlimited(): boolean {
    return this.saloonForm.get('radiusUnlimited')?.value === true;
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
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        this.error = 'Le fichier doit être une image JPG, PNG ou WebP';
        return;
      }

      this.selectedFile = file;
      this.imagePreview = URL.createObjectURL(file);
      this.error = null;
    }
  }

  onSubmit(): void {
    if (this.saloonForm.invalid || !this.selectedFile) {
      this.saloonForm.markAllAsTouched();
      if (!this.selectedFile) {
        this.error = 'Veuillez sélectionner une image';
      }
      return;
    }

    this.isLoading = true;
    this.error = null;

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('name', this.saloonForm.get('name')?.value);
    formData.append('address', this.saloonForm.get('address')?.value || '');
    formData.append('city', this.saloonForm.get('city')?.value || '');
    formData.append('country', this.saloonForm.get('country')?.value || 'France');
    formData.append('latitude', this.saloonForm.get('latitude')?.value);
    formData.append('longitude', this.saloonForm.get('longitude')?.value);
    formData.append('radiusUnlimited', this.radiusUnlimited ? 'true' : 'false');
    if (!this.radiusUnlimited) {
      formData.append('radiusMeters', this.saloonForm.get('radiusMeters')?.value || '100');
    }
    formData.append('type', this.saloonForm.get('type')?.value || 'BAR');
    formData.append('isPrivate', this.saloonForm.get('isPrivate')?.value ? 'true' : 'false');

    this._adminService.createSaloonWithImage(formData).subscribe({
      next: () => {
        this.success = true;
        this.isLoading = false;
        setTimeout(() => {
          this._router.navigate(['dashboard', 'saloons-list']);
        }, 1500);
      },
      error: err => {
        this.error = err.error?.message || 'Erreur lors de la création du saloon';
        this.isLoading = false;
      },
    });
  }

  resetForm(): void {
    this.saloonForm.reset({
      country: 'France',
      radiusMeters: 100,
      radiusUnlimited: false,
      type: 'BAR',
      isPrivate: false,
    });
    this.selectedFile = null;
    this.imagePreview = null;
    this.error = null;
    this.success = false;
  }
}
