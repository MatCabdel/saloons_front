import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FirebaseAuthService } from '../../services/firebase-auth.service';
import { environment } from 'src/environments/environment';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  Observable,
  of,
  switchMap,
} from 'rxjs';

type OnboardingStep = 'username' | 'birthdate' | 'city' | 'photo' | 'bio' | 'warning';

type CompleteProfileRequest = {
  userName: string;
  birthDate: string;
  city?: string;
  postalCode?: string;
  imgUrl?: string;
  description?: string;
};

type GeoCity = {
  nom: string;
  code: string;
  codesPostaux: string[];
  codeDepartement: string;
  departement: { nom: string };
  region: { nom: string };
};

@Component({
  selector: 'app-onboarding-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './onboarding-page.component.html',
  styleUrl: './onboarding-page.component.scss',
})
export class OnboardingPageComponent {
  private readonly _MIN_CITY_SEARCH_LENGTH = 2;
  private _fb = inject(FormBuilder);
  private _http = inject(HttpClient);
  private _router = inject(Router);
  private _firebaseAuth = inject(FirebaseAuthService);
  private readonly _BASE_URL = environment.apiUrl;

  currentStep = signal<OnboardingStep>('username');
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  photoPreview = signal<string | null>(null);

  // L'ordre des étapes : username → birthdate → city → photo → bio → warning (à la fin)
  steps: OnboardingStep[] = ['username', 'birthdate', 'city', 'photo', 'bio', 'warning'];
  stepTitles: Record<OnboardingStep, string> = {
    username: 'Choisissez votre pseudo',
    birthdate: 'Date de naissance',
    city: 'Votre ville',
    photo: 'Photo de profil',
    bio: 'À propos de vous',
    warning: 'Règles de la communauté',
  };

  // Username form
  usernameForm: FormGroup = this._fb.group({
    userName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
  });

  // Birthdate form
  birthdateForm: FormGroup = this._fb.group({
    birthDate: ['', [Validators.required]],
  });

  // City form
  cityForm: FormGroup = this._fb.group({
    citySearch: [''],
    city: ['', [Validators.required]],
    postalCode: [''],
  });

  // City autocomplete
  citySuggestions = signal<GeoCity[]>([]);
  showCitySuggestions = signal(false);
  selectedCity = signal<GeoCity | null>(null);

  // Bio form
  bioForm: FormGroup = this._fb.group({
    description: ['', [Validators.maxLength(500)]],
  });

  private _photoFile: File | null = null;
  private _photoPreviewUrl: string | null = null;

  constructor() {
    this._setupCityAutocomplete();
  }

  private _setupCityAutocomplete(): void {
    this.cityForm
      .get('citySearch')
      ?.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((value: string) => {
          // Ne pas rechercher si une ville est déjà sélectionnée
          if (this.selectedCity()) {
            return false;
          }
          return !!value && value.length >= this._MIN_CITY_SEARCH_LENGTH;
        }),
        switchMap((value: string) =>
          this._searchCities(value).pipe(catchError(() => of([] as GeoCity[])))
        )
      )
      .subscribe(cities => {
        this.citySuggestions.set(cities);
        this.showCitySuggestions.set(cities.length > 0);
      });
  }

  private _searchCities(query: string): Observable<GeoCity[]> {
    return this._http.get<GeoCity[]>(
      `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(
        query
      )}&fields=nom,code,codesPostaux,codeDepartement,departement,region&boost=population&limit=10`
    );
  }

  private async _ensureCityValue(): Promise<boolean> {
    if (this.selectedCity()) {
      return this.cityForm.valid;
    }

    const manualCityInput = this._getManualCityInput();
    if (manualCityInput.length < this._MIN_CITY_SEARCH_LENGTH) {
      return false;
    }

    const resolvedCity = await this._findMatchingCity(manualCityInput);
    if (resolvedCity) {
      this.selectCity(resolvedCity);
      return true;
    }

    const normalizedCity = this._normalizeCityLabel(manualCityInput);
    this.cityForm.patchValue({
      citySearch: normalizedCity,
      city: normalizedCity,
      postalCode: '',
    });
    this.errorMessage.set(null);
    return true;
  }

  private async _findMatchingCity(query: string): Promise<GeoCity | null> {
    const cities = await firstValueFrom(
      this._searchCities(query).pipe(catchError(() => of([] as GeoCity[])))
    );
    const normalizedQuery = this._normalizeCityKey(query);
    return cities.find(city => this._normalizeCityKey(city.nom) === normalizedQuery) ?? null;
  }

  private _getManualCityInput(): string {
    return String(this.cityForm.get('citySearch')?.value ?? '')
      .trim()
      .replace(/\s+/g, ' ');
  }

  private _normalizeCityLabel(value: string): string {
    const normalizedCity = value.trim().replace(/\s+/g, ' ');
    const lowerCased = normalizedCity.toLocaleLowerCase('fr-FR');

    let capitalizeNext = true;

    return Array.from(lowerCased)
      .map(character => {
        if (capitalizeNext && /\p{L}/u.test(character)) {
          capitalizeNext = false;
          return character.toLocaleUpperCase('fr-FR');
        }

        capitalizeNext = /[\s'-]/.test(character);
        return character;
      })
      .join('');
  }

  private _normalizeCityKey(value: string): string {
    return this._normalizeCityLabel(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s'-]/g, '')
      .toLocaleLowerCase('fr-FR');
  }

  selectCity(city: GeoCity): void {
    this.selectedCity.set(city);
    const postalCode = city.codesPostaux[0] || '';
    this.cityForm.patchValue({
      citySearch: `${city.nom} (${postalCode})`,
      city: city.nom,
      postalCode: postalCode,
    });
    this.showCitySuggestions.set(false);
    this.citySuggestions.set([]); // Vider les suggestions après sélection
  }

  onCityInputFocus(): void {
    // Si une ville est sélectionnée et que l'utilisateur clique sur l'input,
    // on réinitialise pour permettre une nouvelle recherche
    if (this.selectedCity()) {
      this.selectedCity.set(null);
      this.cityForm.patchValue({
        citySearch: '',
        city: '',
        postalCode: '',
      });
    }
    if (this.citySuggestions().length > 0) {
      this.showCitySuggestions.set(true);
    }
  }

  onCityInputBlur(): void {
    // Délai pour permettre le clic sur une suggestion
    setTimeout(() => this.showCitySuggestions.set(false), 200);
  }

  get canContinueFromCity(): boolean {
    return (
      this.selectedCity() !== null ||
      this._getManualCityInput().length >= this._MIN_CITY_SEARCH_LENGTH
    );
  }

  get currentStepIndex(): number {
    return this.steps.indexOf(this.currentStep());
  }

  get progressPercent(): number {
    return ((this.currentStepIndex + 1) / this.steps.length) * 100;
  }

  get minBirthDate(): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 100);
    return this._formatDateForInput(date);
  }

  get maxBirthDate(): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return this._formatDateForInput(date);
  }

  // Appelé quand l'utilisateur accepte les règles (dernière étape)
  acceptWarningAndSubmit(): void {
    this.submitProfile();
  }

  async nextStep(): Promise<void> {
    const currentIndex = this.currentStepIndex;
    const step = this.currentStep();

    // Validate current step
    if (step === 'username' && this.usernameForm.invalid) {
      this.usernameForm.markAllAsTouched();
      return;
    }

    if (step === 'birthdate' && this.birthdateForm.invalid) {
      this.birthdateForm.markAllAsTouched();
      return;
    }

    // Check age validation
    if (step === 'birthdate') {
      const age = this._calculateAge(this.birthdateForm.value.birthDate);
      if (age === null) {
        this.errorMessage.set('Date de naissance invalide');
        return;
      }
      if (age < 18) {
        this.errorMessage.set('Vous devez avoir au moins 18 ans pour utiliser Saloons');
        return;
      }
      this.errorMessage.set(null);
    }

    if (step === 'city') {
      const cityIsValid = await this._ensureCityValue();
      if (!cityIsValid) {
        this.cityForm.markAllAsTouched();
        return;
      }
    }

    if (currentIndex < this.steps.length - 1) {
      this.currentStep.set(this.steps[currentIndex + 1]);
    }
  }

  prevStep(): void {
    const currentIndex = this.currentStepIndex;
    if (currentIndex > 0) {
      this.currentStep.set(this.steps[currentIndex - 1]);
    }
  }

  onPhotoSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this._clearPhotoSelection(input);
        this.errorMessage.set('Veuillez sélectionner une image');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this._clearPhotoSelection(input);
        this.errorMessage.set("L'image ne doit pas dépasser 10MB");
        return;
      }

      this._photoFile = file;
      this.errorMessage.set(null);
      this._setPhotoPreview(file);
    }
  }

  removePhoto(): void {
    this._clearPhotoSelection();
  }

  skipPhoto(): void {
    this.nextStep();
  }

  async submitProfile(): Promise<void> {
    const user = this._firebaseAuth.currentUser();
    if (!user) {
      this._router.navigate(['/auth']);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      // Upload photo first if exists
      let imgUrl: string | undefined;
      if (this._photoFile) {
        imgUrl = await this._uploadPhoto();
      }

      const request: CompleteProfileRequest = {
        userName: this.usernameForm.value.userName,
        birthDate: this.birthdateForm.value.birthDate,
        city: this.cityForm.value.city,
        postalCode: this.cityForm.value.postalCode || undefined,
        imgUrl,
        description: this.bioForm.value.description || undefined,
      };

      this._http.put(`${this._BASE_URL}/profile/complete-profile`, request).subscribe({
        next: (response: unknown) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          this._firebaseAuth.updateCurrentUser(response as any);
          this.isLoading.set(false);
          this._router.navigate(['/map']);
        },
        error: err => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.message || 'Une erreur est survenue');
        },
      });
    } catch {
      this.isLoading.set(false);
      this.errorMessage.set('Erreur lors du téléchargement de la photo');
    }
  }

  private _uploadPhoto(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this._photoFile) {
        reject(new Error('No file selected'));
        return;
      }

      const formData = new FormData();
      formData.append('image', this._photoFile);

      // The upload endpoint returns a UserDTO with the updated imgUrl
      this._http
        .post<{ imgUrl: string }>(`${this._BASE_URL}/profile/upload-profile-image`, formData)
        .subscribe({
          next: response => resolve(response.imgUrl || ''),
          error: err => reject(err),
        });
    });
  }

  // Form validation helpers
  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'Ce champ est requis';
    if (field.errors['minlength']) {
      const minLength = field.errors['minlength'].requiredLength;
      return `Minimum ${minLength} caractères`;
    }
    if (field.errors['maxlength']) {
      const maxLength = field.errors['maxlength'].requiredLength;
      return `Maximum ${maxLength} caractères`;
    }

    return '';
  }

  private _formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private _parseLocalDate(dateValue: string | null | undefined): Date | null {
    if (!dateValue || typeof dateValue !== 'string') {
      return null;
    }

    const [yearRaw, monthRaw, dayRaw] = dateValue.split('-');
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    const day = Number(dayRaw);

    if (!year || !month || !day) {
      return null;
    }

    return new Date(year, month - 1, day);
  }

  private _calculateAge(dateValue: string | null | undefined): number | null {
    const birthDate = this._parseLocalDate(dateValue);
    if (!birthDate) {
      return null;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const hasBirthdayPassed =
      monthDiff > 0 || (monthDiff === 0 && today.getDate() >= birthDate.getDate());

    if (!hasBirthdayPassed) {
      age--;
    }

    return age;
  }

  get hasSelectedPhoto(): boolean {
    return this._photoFile !== null;
  }

  private _setPhotoPreview(file: File): void {
    if (this._photoPreviewUrl) {
      URL.revokeObjectURL(this._photoPreviewUrl);
    }
    this._photoPreviewUrl = URL.createObjectURL(file);
    this.photoPreview.set(this._photoPreviewUrl);
  }

  private _clearPhotoSelection(input?: HTMLInputElement): void {
    this._photoFile = null;
    if (this._photoPreviewUrl) {
      URL.revokeObjectURL(this._photoPreviewUrl);
      this._photoPreviewUrl = null;
    }
    this.photoPreview.set(null);
    if (input) {
      input.value = '';
    }
  }
}
