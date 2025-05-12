import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { strongPasswordValidator } from '../components/validator-password/password-strengh';
import { checkEqualityValidator } from '../components/validator-password/equality-passwords';
import { UserService } from 'src/app/features/user/services/user.service';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { FileUploadComponent } from '../../../../common/components/file-upload/file-upload.component';

@Component({
  selector: 'app-register-profil',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FileUploadComponent],
  templateUrl: './register-profil.component.html',
  styleUrl: './register-profil.component.scss',
})
export class RegisterProfilComponent implements OnInit {
  private static readonly _MIN_STEP = 1;
  private static readonly _MAX_STEP = 3;

  formGroup!: FormGroup;
  step = RegisterProfilComponent._MIN_STEP;

  file: File | null = null;
  fileName = '';
  imageUrl: SafeUrl | null = null;

  private _fb = inject(FormBuilder);
  private _userService = inject(UserService);
  private _sanitizer = inject(DomSanitizer);

  ngOnInit(): void {
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
    // Aperçu :
    this.imageUrl = this._sanitizer.bypassSecurityTrustUrl(window.URL.createObjectURL(event.file));
    // Injecte le File dans le FormControl pour lever la validation
    this.formGroup.get('profile.imgUrl')!.setValue(event.file);
  }

  /** Envoi final : construit un FormData et appelle le service */
  onFinish(): void {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const { account, meta } = this.formGroup.value;

    const formData = new FormData();
    formData.append('email', account.email);
    formData.append('password', account.password);
    formData.append('username', meta.username);
    if (this.file) {
      formData.append('image', this.file, this.fileName);
    }

    // 3) Appel au service
    this._userService.createUser(formData).subscribe({
      next: () => alert('Inscription réussie !'),
      error: err => console.error("Erreur à l'inscription :", err),
    });
  }
}
