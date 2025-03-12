import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { strongPasswordValidator } from '../validator-password/password-strengh';
import { checkEqualityValidator } from '../validator-password/equality-passwords';
import { CommonModule } from '@angular/common';
import { environment } from 'src/environments/environment.production';
import { UserService } from '../../../../user/services/user.service';

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './register-form.component.html',
  styleUrl: './register-form.component.scss',
})
export class RegisterFormComponent implements OnInit {
  private _formBuilder = inject(FormBuilder);
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);
  private _userService = inject(UserService);

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
    this._route.data.subscribe(data => {
      this.role = data['role'];
    });
  }

  onSubmit(): void {
    console.log("🟢 Bouton S'inscrire cliqué");

    if (this.registerForm.invalid) {
      console.log('🔴 Formulaire invalide :', this.registerForm.value);
      return;
    }

    console.log('📡 Envoi de la requête API à :', `${environment.apiUrl}`);
    console.log('📦 Données envoyées :', this.registerForm.value);

    this._userService.createUser(this.registerForm.value).subscribe({
      next: response => {
        console.log('✅ Utilisateur inscrit avec succès :', response);
        alert('Inscription réussie !');
        this._router.navigate(['/login']);
      },
      error: err => {
        console.error("❌ Erreur lors de l'inscription :", err);
      },
    });
  }
}
