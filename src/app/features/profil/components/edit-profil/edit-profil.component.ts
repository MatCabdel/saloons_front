import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, take } from 'rxjs';
import { FileUploadComponent } from '../../../../common/components/file-upload/file-upload.component';
import { UserDTO } from '../../../user/models/userDTO';
import { UserService } from '../../../user/services/user.service';
import { UserStoreService } from '../../../user/store/user-store.service';

@Component({
  selector: 'app-edit-profil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FileUploadComponent],
  templateUrl: './edit-profil.component.html',
  styleUrl: './edit-profil.component.scss',
})
export class EditProfilComponent implements OnInit {
  private _fb = inject(FormBuilder);
  private _router = inject(Router);
  private _userStore = inject(UserStoreService);
  private _userService = inject(UserService);

  user$: Observable<UserDTO | null> = this._userStore.getUserConnected$();
  currentUser: UserDTO | null = null;
  imageUrl: string | null = null;
  selectedFile: File | null = null;
  isLoading = false;

  formGroup: FormGroup = this._fb.group({
    userName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(30)]],
    city: ['', [Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
  });

  ngOnInit(): void {
    this.user$.pipe(take(1)).subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.imageUrl = user.imgUrl || null;
        this.formGroup.patchValue({
          userName: user.userName || '',
          city: user.city || '',
          description: user.description || '',
        });
      }
    });
  }

  receiveImage(event: { file: File; fileName: string }): void {
    this.selectedFile = event.file;
    this.imageUrl = URL.createObjectURL(event.file);
  }

  goBack(): void {
    this._router.navigate(['/profil']);
  }

  onSubmit(): void {
    if (this.formGroup.invalid || !this.currentUser) {
      return;
    }

    this.isLoading = true;

    const updatedData = {
      userName: this.formGroup.get('userName')?.value,
      city: this.formGroup.get('city')?.value,
      description: this.formGroup.get('description')?.value,
    };

    // Si une nouvelle image a été sélectionnée, on l'upload d'abord
    if (this.selectedFile) {
      this._userService.updateUserImage(this.selectedFile).subscribe({
        next: () => {
          this._updateUserProfile(updatedData);
        },
        error: err => {
          console.error('Erreur upload image:', err);
          this.isLoading = false;
        },
      });
    } else {
      this._updateUserProfile(updatedData);
    }
  }

  private _updateUserProfile(data: { userName: string; city: string; description: string }): void {
    if (!this.currentUser) return;

    this._userService.updateUserProfile(this.currentUser.id, data).subscribe({
      next: updatedUser => {
        this._userStore.setUserConnected(updatedUser);
        this.isLoading = false;
        this._router.navigate(['/profil']);
      },
      error: err => {
        console.error('Erreur mise à jour profil:', err);
        this.isLoading = false;
      },
    });
  }
}
