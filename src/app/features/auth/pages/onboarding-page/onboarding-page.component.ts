import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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
type BirthDateSelector = 'day' | 'month' | 'year';

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
  private readonly _MAX_SOURCE_PHOTO_SIZE_BYTES = 15 * 1024 * 1024;
  private readonly _MAX_UPLOAD_PHOTO_SIZE_BYTES = 10 * 1024 * 1024;
  private _fb = inject(FormBuilder);
  private _http = inject(HttpClient);
  private _router = inject(Router);
  private _firebaseAuth = inject(FirebaseAuthService);
  private readonly _BASE_URL = environment.apiUrl;

  currentStep = signal<OnboardingStep>('username');
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  photoPreview = signal<string | null>(null);
  isPhotoSourceChooserOpen = signal(false);
  isBirthDatePickerOpen = signal(false);
  activeBirthDateSelector = signal<BirthDateSelector | null>(null);
  selectedBirthDay = signal(1);
  selectedBirthMonth = signal(1);
  selectedBirthYear = signal(new Date().getFullYear() - 18);

  readonly birthMonths = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ];
  readonly birthYears = this._buildBirthYears();

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

  get birthDays(): number[] {
    const dayCount = new Date(this.selectedBirthYear(), this.selectedBirthMonth(), 0).getDate();
    return Array.from({ length: dayCount }, (_, index) => index + 1);
  }

  get formattedBirthDate(): string {
    const date = this._parseLocalDate(this.birthdateForm.value.birthDate);
    if (!date) {
      return 'Sélectionner une date';
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  openBirthDatePicker(): void {
    const currentDate = this._parseLocalDate(this.birthdateForm.value.birthDate);
    const defaultDate = currentDate ?? this._parseLocalDate(this.maxBirthDate);
    if (defaultDate) {
      this.selectedBirthDay.set(defaultDate.getDate());
      this.selectedBirthMonth.set(defaultDate.getMonth() + 1);
      this.selectedBirthYear.set(defaultDate.getFullYear());
    }
    this.isBirthDatePickerOpen.set(true);
  }

  closeBirthDatePicker(): void {
    this.activeBirthDateSelector.set(null);
    this.isBirthDatePickerOpen.set(false);
  }

  toggleBirthDateSelector(selector: BirthDateSelector): void {
    this.activeBirthDateSelector.update(current => (current === selector ? null : selector));
  }

  selectBirthDay(day: number): void {
    this.selectedBirthDay.set(day);
    this.activeBirthDateSelector.set(null);
  }

  selectBirthMonth(month: number): void {
    this.selectedBirthMonth.set(month);
    this._clampSelectedBirthDay();
    this.activeBirthDateSelector.set(null);
  }

  selectBirthYear(year: number): void {
    this.selectedBirthYear.set(year);
    this._clampSelectedBirthDay();
    this.activeBirthDateSelector.set(null);
  }

  confirmBirthDate(): void {
    const date = new Date(
      this.selectedBirthYear(),
      this.selectedBirthMonth() - 1,
      this.selectedBirthDay()
    );
    const formattedDate = this._formatDateForInput(date);
    if (formattedDate < this.minBirthDate || formattedDate > this.maxBirthDate) {
      this.errorMessage.set('La date doit correspondre à un âge compris entre 18 et 100 ans.');
      return;
    }

    this.birthdateForm.get('birthDate')?.setValue(formattedDate);
    this.birthdateForm.get('birthDate')?.markAsTouched();
    this.errorMessage.set(null);
    this.closeBirthDatePicker();
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

  openPhotoSourceChooser(): void {
    this.isPhotoSourceChooserOpen.set(true);
  }

  closePhotoSourceChooser(): void {
    this.isPhotoSourceChooserOpen.set(false);
  }

  async onPhotoSelect(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.closePhotoSourceChooser();
      const file = input.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this._clearPhotoSelection(input);
        this.errorMessage.set('Veuillez sélectionner une image');
        return;
      }

      // Keep source files bounded to avoid excessive memory usage while decoding on mobile.
      if (file.size > this._MAX_SOURCE_PHOTO_SIZE_BYTES) {
        this._clearPhotoSelection(input);
        this.errorMessage.set("La photo d'origine ne doit pas dépasser 15 Mo");
        return;
      }

      try {
        const normalizedPhoto = await this._normalizePhoto(file);
        if (normalizedPhoto.size > this._MAX_UPLOAD_PHOTO_SIZE_BYTES) {
          this._clearPhotoSelection(input);
          this.errorMessage.set('La photo reste trop lourde après réduction (maximum 10 Mo)');
          return;
        }
        this._photoFile = normalizedPhoto;
        this.errorMessage.set(null);
        this._setPhotoPreview(normalizedPhoto);
      } catch {
        this._clearPhotoSelection(input);
        this.errorMessage.set(
          'Cette photo ne peut pas être traitée. Essayez une autre photo ou une image JPG.'
        );
      }
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
    } catch (error: unknown) {
      this.isLoading.set(false);
      this.errorMessage.set(this._getPhotoUploadErrorMessage(error));
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

  private _normalizePhoto(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();

      image.onload = (): void => {
        URL.revokeObjectURL(objectUrl);

        const maxDimension = 1600;
        const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Canvas unavailable'));
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        canvas.toBlob(
          blob => {
            if (!blob) {
              reject(new Error('Image conversion failed'));
              return;
            }

            resolve(new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' }));
          },
          'image/jpeg',
          0.88
        );
      };

      image.onerror = (): void => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Image decoding failed'));
      };
      image.src = objectUrl;
    });
  }

  private _getPhotoUploadErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage = error.error?.message;
      if (typeof backendMessage === 'string' && backendMessage.trim()) {
        return backendMessage;
      }
      if (error.status === 401 || error.status === 403) {
        return 'Votre session a expiré. Veuillez vous reconnecter.';
      }
    }

    return 'Erreur lors du téléchargement de la photo';
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

  private _buildBirthYears(): number[] {
    const youngestYear = new Date().getFullYear() - 18;
    const oldestYear = new Date().getFullYear() - 100;
    return Array.from(
      { length: youngestYear - oldestYear + 1 },
      (_, index) => youngestYear - index
    );
  }

  private _clampSelectedBirthDay(): void {
    const lastDay = new Date(this.selectedBirthYear(), this.selectedBirthMonth(), 0).getDate();
    if (this.selectedBirthDay() > lastDay) {
      this.selectedBirthDay.set(lastDay);
    }
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
