import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { strongPasswordValidator } from '../components/validator-password/password-strengh';
import { checkEqualityValidator } from '../components/validator-password/equality-passwords';
import { UserService } from '../../../user/services/user.service';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { FileUploadComponent } from '../../../../common/components/file-upload/file-upload.component';
import { FieldErrorComponent } from '../../common/field-error/field-error.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-register-profil',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FileUploadComponent, FieldErrorComponent],
  templateUrl: './register-profil.component.html',
  styleUrl: './register-profil.component.scss',
})
export class RegisterProfilComponent implements OnInit {
  private static readonly _MIN_STEP = 1;
  private static readonly _MAX_STEP = 6;

  formGroup!: FormGroup;
  step = RegisterProfilComponent._MIN_STEP;
  maxBirthDate!: string;

  file: File | null = null;
  fileName = '';
  imageUrl: SafeUrl | null = null;
  submitted = false;
  showPassword = false;
  showConfirmPassword = false;
  showConditionsModal = false;

  private _fb = inject(FormBuilder);
  private _userService = inject(UserService);
  private _sanitizer = inject(DomSanitizer);
  private _destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    this.maxBirthDate = d.toISOString().split('T')[0];

    this.formGroup = this._fb.group({
      account: this._fb.group(
        {
          lastname: ['', Validators.required],
          email: ['', [Validators.required, Validators.email]],
          password: ['', [Validators.required, strongPasswordValidator()]],
          checkPassword: ['', Validators.required],
        },
        { validators: checkEqualityValidator('password', 'checkPassword') }
      ),
      profile: this._fb.group({
        imgUrl: [null, Validators.required],
      }),
      meta: this._fb.group({
        username: ['', [Validators.required, Validators.minLength(3)]],
      }),
      birth: this._fb.group({
        dateOfBirth: ['', [Validators.required, this.minAgeValidator(18)]],
      }),
      bio: this._fb.group({
        description: ['', [Validators.required, Validators.maxLength(280)]],
      }),
      location: this._fb.group({
        city: ['', [Validators.required, Validators.minLength(2)]],
        rgpdAccepted: [false, Validators.requiredTrue]
      }),
    });
  }

  nextStep(): void {
    if (this.step < RegisterProfilComponent._MAX_STEP) this.step++;
  }
  prevStep(): void {
    if (this.step > RegisterProfilComponent._MIN_STEP) this.step--;
  }

  receiveImage(event: { file: File; fileName: string }): void {
    this.file = event.file;
    this.fileName = event.fileName;

    this.imageUrl = this._sanitizer.bypassSecurityTrustUrl(window.URL.createObjectURL(event.file));

    this.formGroup.get('profile.imgUrl')!.setValue(event.file);
  }

  onFinish(): void {
    this.submitted = true;
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const { account, meta, birth, bio, location } = this.formGroup.value;

    const formData = new FormData();
    formData.append('email', account.email);
    formData.append('password', account.password);
    formData.append('username', meta.username);
    if (birth?.dateOfBirth) formData.append('birthDate', birth.dateOfBirth);
    if (bio?.description) formData.append('description', bio.description);
    if (location?.city) formData.append('city', location.city);
    formData.append('rgpdAccepted', location.rgpdAccepted ? 'true' : 'false');
    if (this.file) {
      formData.append('image', this.file, this.fileName);
    }

    this._userService
      .createUser(formData)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => alert('Inscription réussie !'));
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
  minAgeValidator(minYears: number): ValidatorFn {
    return (control: AbstractControl) => {
      const value = control.value;
      if (!value) return null;
      const birth = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear() - (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
      return age >= minYears ? null : { minAge: { requiredAge: minYears, actualAge: age } };
    };
  }
  openDatePicker(input: HTMLInputElement): void {
    (input as any).showPicker?.();
    input.focus();
  }
  openConditionsModal(event: Event): void {
  event.preventDefault();
  this.showConditionsModal = true;
}
closeConditionsModal(): void {
  this.showConditionsModal = false;
}

}
