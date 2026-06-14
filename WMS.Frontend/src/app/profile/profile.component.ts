import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../environments/environment';

interface ProfileDto {
  employeeId: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  gender: string;
  dob: string;
  doj: string;
  departmentName: string;
  roleName: string;
  status: string;
  username: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  profile: ProfileDto | null = null;
  loading = true;
  saving = false;
  changingPassword = false;

  editForm!: FormGroup;
  passwordForm!: FormGroup;
  hideCurrentPw = true;
  hideNewPw = true;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private snack: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.editForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      gender: [''],
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );

    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.http.get<ProfileDto>(`${environment.apiUrl}/profile`).subscribe({
      next: (p) => {
        this.zone.run(() => {
          this.profile = p;
          this.editForm.patchValue({
            firstName: p.firstName,
            lastName: p.lastName,
            phoneNumber: p.phoneNumber,
            gender: p.gender,
          });
          this.loading = false;
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.loading = false;
          this.cdr.markForCheck();
          this.snack.open('Failed to load profile', 'Close', { duration: 3000, panelClass: 'snack-error' });
        });
      },
    });
  }

  saveProfile(): void {
    if (this.editForm.invalid) return;
    this.saving = true;
    this.http.put(`${environment.apiUrl}/profile`, this.editForm.value).subscribe({
      next: () => {
        this.saving = false;
        this.snack.open('Profile updated', 'Close', { duration: 3000, panelClass: 'snack-success' });
        this.loadProfile();
      },
      error: () => {
        this.saving = false;
        this.snack.open('Failed to update profile', 'Close', { duration: 3000, panelClass: 'snack-error' });
      },
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    this.changingPassword = true;
    const { currentPassword, newPassword } = this.passwordForm.value;
    this.http.post(`${environment.apiUrl}/auth/change-password`, { currentPassword, newPassword }).subscribe({
      next: () => {
        this.changingPassword = false;
        this.passwordForm.reset();
        this.snack.open('Password changed successfully', 'Close', { duration: 3000, panelClass: 'snack-success' });
      },
      error: (err) => {
        this.changingPassword = false;
        const msg = err.error?.message ?? 'Failed to change password';
        this.snack.open(msg, 'Close', { duration: 4000, panelClass: 'snack-error' });
      },
    });
  }

  private passwordMatchValidator(g: FormGroup) {
    const np = g.get('newPassword')?.value;
    const cp = g.get('confirmPassword')?.value;
    return np === cp ? null : { mismatch: true };
  }
}
