import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { ProfileDto } from '../../models/wms.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './profile.component.html',
  styles: []
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private apiUrl = environment.apiUrl;

  public profile: ProfileDto | null = null;
  public isLoading = false;
  public isSavingProfile = false;
  public isChangingPassword = false;

  // Form groups
  public profileForm!: FormGroup;
  public passwordForm!: FormGroup;

  // Password hide triggers
  public hideCurrent = true;
  public hideNew = true;
  public hideConfirm = true;

  ngOnInit(): void {
    this.loadProfile();
    this.initPasswordForm();
  }

  private loadProfile(): void {
    this.isLoading = true;
    this.http.get<ProfileDto>(`${this.apiUrl}/Profile`).subscribe({
      next: (res) => {
        this.profile = res;
        this.initProfileForm(res);
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load user profile:', err);
      }
    });
  }

  private initProfileForm(prof: ProfileDto): void {
    this.profileForm = this.fb.group({
      firstName: [prof.firstName, [Validators.required, Validators.maxLength(50)]],
      lastName: [prof.lastName, [Validators.required, Validators.maxLength(50)]],
      phoneNumber: [prof.phoneNumber, [Validators.required, Validators.maxLength(15)]],
      gender: [prof.gender || '']
    });
  }

  private initPasswordForm(): void {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(g: FormGroup) {
    const password = g.get('newPassword')?.value;
    const confirm = g.get('confirmPassword')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  public onUpdateProfile(): void {
    if (this.profileForm.invalid) return;

    this.isSavingProfile = true;
    this.http.put<ProfileDto>(`${this.apiUrl}/Profile`, this.profileForm.value).subscribe({
      next: (res) => {
        this.profile = res;
        this.isSavingProfile = false;
        this.snackBar.open('Contact details updated successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      },
      error: () => {
        this.isSavingProfile = false;
      }
    });
  }

  public onChangePassword(): void {
    if (this.passwordForm.invalid) return;

    this.isChangingPassword = true;
    const formValue = this.passwordForm.value;

    this.authService.changePassword({
      currentPassword: formValue.currentPassword,
      newPassword: formValue.newPassword
    }).subscribe({
      next: () => {
        this.isChangingPassword = false;
        this.passwordForm.reset();
        this.snackBar.open('Password updated successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      },
      error: () => {
        this.isChangingPassword = false;
      }
    });
  }
}
