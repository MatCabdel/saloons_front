import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { strongPasswordValidator } from '../validator-password/password-strengh';
import { checkEqualityValidator } from '../validator-password/equality-passwords';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../../user/services/user.service';
import { FieldErrorComponent } from '../../../common/field-error/field-error.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FieldErrorComponent],
  templateUrl: './register-form.component.html',
  styleUrl: './register-form.component.scss',
})
export class RegisterFormComponent implements OnInit {
  private _formBuilder = inject(FormBuilder);
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);
  private _userService = inject(UserService);
  private _destroyRef = inject(DestroyRef);

  registerForm = this._formBuilder.nonNullable.group(
    {
      lastname: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, strongPasswordValidator()]],
      checkPassword: ['', [Validators.required]],
      checkboxCgv: [false, [Validators.requiredTrue]],
    },
    {
      validators: checkEqualityValidator('password', 'checkPassword'),
    }
  );

  role!: string;
  showPassword = false;
  showConfirmPassword = false;

  ngOnInit(): void {
    this._route.data.pipe(takeUntilDestroyed(this._destroyRef)).subscribe(data => {
      this.role = data['role'];
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    const formValue = this.registerForm.value;
    const formData = new FormData();
    formData.append('lastname', formValue.lastname ?? '');
    formData.append('email', formValue.email ?? '');
    formData.append('password', formValue.password ?? '');

    this._userService
      .createUser(formData)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          alert('Inscription réussie !');
          this._router.navigate(['/login']);
        },
        error: err => {
          console.error("Erreur lors de l'inscription :", err);
        },
      });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}
