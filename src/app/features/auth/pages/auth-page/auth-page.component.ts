import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FirebaseAuthService } from '../../services/firebase-auth.service';
import { environment } from 'src/environments/environment';

type AuthMode = 'register' | 'login' | 'register-email';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './auth-page.component.html',
  styleUrl: './auth-page.component.scss',
})
export class AuthPageComponent implements OnInit {
  private _fb = inject(FormBuilder);
  private _firebaseAuth = inject(FirebaseAuthService);
  private _router = inject(Router);

  mode = signal<AuthMode>('register');
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  // Formulaire inscription email
  registerForm: FormGroup = this._fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  // Formulaire connexion
  loginForm: FormGroup = this._fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  ngOnInit(): void {
    const url = this._router.url;
    if (url.includes('login')) {
      this.mode.set('login');
    } else {
      this.mode.set('register');
    }
  }

  goToRegister(): void {
    this.mode.set('register');
    this.errorMessage.set(null);
    this._router.navigate(['/']);
  }

  goToLogin(): void {
    this.mode.set('login');
    this.errorMessage.set(null);
    this._router.navigate(['/login']);
  }

  goToRegisterEmail(): void {
    this.mode.set('register-email');
    this.errorMessage.set(null);
  }

  goToForgotPassword(): void {
    this._router.navigate(['/mot-de-passe-oublie']);
  }

  backToRegister(): void {
    this.mode.set('register');
    this.errorMessage.set(null);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(v => !v);
  }

  onGoogleAuth(): void {
    // Vérifier si Firebase est configuré
    if (environment.firebase.apiKey === 'YOUR_FIREBASE_API_KEY') {
      this.errorMessage.set("Firebase n'est pas encore configuré. Utilisez la connexion par email.");
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this._firebaseAuth.signInWithGoogle().subscribe({
      next: response => {
        this.isLoading.set(false);
        this._handleAuthSuccess(response.newUser, response.user.profileStatus, response.user.role);
      },
      error: err => {
        this.isLoading.set(false);
        this.errorMessage.set(this._getErrorMessage(err));
      },
    });
  }

  onFacebookAuth(): void {
    // Vérifier si Firebase est configuré
    if (environment.firebase.apiKey === 'YOUR_FIREBASE_API_KEY') {
      this.errorMessage.set("Firebase n'est pas encore configuré. Utilisez la connexion par email.");
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this._firebaseAuth.signInWithFacebook().subscribe({
      next: response => {
        this.isLoading.set(false);
        this._handleAuthSuccess(response.newUser, response.user.profileStatus, response.user.role);
      },
      error: err => {
        this.isLoading.set(false);
        this.errorMessage.set(this._getErrorMessage(err));
      },
    });
  }

  onEmailRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { password, confirmPassword } = this.registerForm.value;
    if (password !== confirmPassword) {
      this.errorMessage.set('Les mots de passe ne correspondent pas');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this._firebaseAuth
      .registerWithEmail({
        firstName: this.registerForm.value.firstName,
        lastName: this.registerForm.value.lastName,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
      })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this._router.navigate(['/onboarding']);
        },
        error: err => {
          this.isLoading.set(false);
          this.errorMessage.set(this._getErrorMessage(err));
        },
      });
  }

  onEmailLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;
    this._firebaseAuth.loginWithEmail(email, password).subscribe({
      next: response => {
        this.isLoading.set(false);
        if (response.user.profileStatus === 'PROFILE_INCOMPLETE') {
          this._router.navigate(['/onboarding']);
        } else if (response.user.role === 'ROLE_ADMIN') {
          this._router.navigate(['/dashboard']);
        } else {
          this._router.navigate(['/map']);
        }
      },
      error: err => {
        this.isLoading.set(false);
        this.errorMessage.set(this._getErrorMessage(err));
      },
    });
  }

  private _handleAuthSuccess(isNewUser: boolean, profileStatus: string, role?: string | null): void {
    if (isNewUser || profileStatus === 'PROFILE_INCOMPLETE') {
      this._router.navigate(['/onboarding']);
    } else if (role === 'ROLE_ADMIN') {
      this._router.navigate(['/dashboard']);
    } else {
      this._router.navigate(['/map']);
    }
  }

  private _getErrorMessage(error: unknown): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;

    console.error('Auth error:', err);
    console.error('Error code:', err?.code);
    console.error('Error message:', err?.message);
    console.error('Error status:', err?.status);
    console.error('Error body:', err?.error);

    // Firebase error codes
    if (err?.code) {
      switch (err.code) {
        case 'auth/popup-closed-by-user':
          return 'Connexion annulée';
        case 'auth/account-exists-with-different-credential':
          return 'Un compte existe déjà avec cet email';
        case 'auth/user-not-found':
          return 'Aucun compte trouvé avec cet email';
        case 'auth/wrong-password':
          return 'Mot de passe incorrect';
        case 'auth/email-already-in-use':
          return 'Cet email est déjà utilisé';
        case 'auth/unauthorized-domain':
          return 'Domaine non autorisé. Ajoutez ce domaine dans Firebase Console.';
        case 'auth/operation-not-allowed':
          return "Cette méthode de connexion n'est pas activée dans Firebase.";
        default:
          return `Erreur Firebase: ${err.code}`;
      }
    }

    // HTTP error from backend
    if (err?.status === 401 || err?.status === 400) {
      // Message du backend
      if (err?.error?.message) {
        return err.error.message;
      }
      if (typeof err?.error === 'string') {
        return err.error;
      }
      return 'Email ou mot de passe incorrect';
    }

    if (err?.status === 404) {
      return 'Aucun compte trouvé avec cet email';
    }

    if (err?.error?.message) {
      return err.error.message;
    }

    if (err?.message) {
      return err.message;
    }

    return 'Une erreur est survenue. Veuillez réessayer.';
  }

  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'Ce champ est requis';
    if (field.errors['email']) return 'Email invalide';
    if (field.errors['minlength']) {
      return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
    }
    return '';
  }
}
