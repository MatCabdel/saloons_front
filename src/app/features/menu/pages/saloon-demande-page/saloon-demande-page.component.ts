import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from 'src/app/common/components/header/header.component';
import { MenuService } from '../../services/menu.service';
import { PlaceType, PLACE_TYPE_LABELS, SaloonDemande } from '../../models/menu.model';
import { UserStoreService } from 'src/app/features/user/store/user-store.service';

@Component({
  selector: 'app-saloon-demande-page',
  standalone: true,
  imports: [CommonModule, HeaderComponent, ReactiveFormsModule, RouterModule],
  templateUrl: './saloon-demande-page.component.html',
  styleUrls: ['./saloon-demande-page.component.scss'],
})
export class SaloonDemandePageComponent {
  form: FormGroup;
  isSubmitting = signal(false);
  isSubmitted = signal(false);
  errorMessage = signal<string | null>(null);

  placeTypes = Object.values(PlaceType);
  placeTypeLabels = PLACE_TYPE_LABELS;

  constructor(
    private _fb: FormBuilder,
    private _menuService: MenuService,
    private _userStore: UserStoreService
  ) {
    this.form = this._fb.group({
      placeName: ['', [Validators.required, Validators.minLength(2)]],
      placeType: ['', Validators.required],
      address: ['', [Validators.required, Validators.minLength(5)]],
      comment: [''],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const user = this._userStore.getUserConnected$().value;
    const demande: SaloonDemande = {
      placeName: this.form.value.placeName,
      placeType: this.form.value.placeType,
      address: this.form.value.address,
      comment: this.form.value.comment || undefined,
      userId: user?.id,
      userEmail: user?.email,
    };

    this._menuService.submitSaloonDemande(demande).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.isSubmitted.set(true);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set('Une erreur est survenue. Réessaie dans quelques instants.');
      },
    });
  }

  resetForm(): void {
    this.form.reset();
    this.isSubmitted.set(false);
    this.errorMessage.set(null);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }
}
