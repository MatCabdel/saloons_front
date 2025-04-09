import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { strongPasswordValidator } from '../validator-password/password-strengh';
import { checkEqualityValidator } from '../validator-password/equality-passwords';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../../user/services/user.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './register-form.component.html',
  styleUrl: './register-form.component.scss',
})
export class RegisterFormComponent implements OnInit, OnDestroy {
  private _formBuilder = inject(FormBuilder);
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);
  private _userService = inject(UserService);

  private _destroy$ = new Subject();

  registerForm = this._formBuilder.nonNullable.group(
    {
      lastname: ['', [Validators.required]],
      //  firstname: ['', [Validators.required]],
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

  ngOnInit(): void {
    this._route.data.pipe(takeUntil(this._destroy$)).subscribe(data => {
      this.role = data['role'];
    });
  }

  ngOnDestroy(): void {
    console.log('[🧹] Composant détruit, unsubscribe effectué.');
    this._destroy$.next(true);
    this._destroy$.complete();
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this._userService
      .createUser(this.registerForm.value)
      .pipe(takeUntil(this._destroy$))
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
}
