import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { Announcement } from '../announcements.component';

@Component({
  selector: 'app-announcement-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSnackBarModule],
  templateUrl: './announcement-form-dialog.component.html'
})
export class AnnouncementFormDialogComponent {
  form: FormGroup;
  isEdit: boolean;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private dialogRef: MatDialogRef<AnnouncementFormDialogComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: Announcement | null
  ) {
    this.isEdit = !!data;
    this.form = this.fb.group({
      title: [data?.title ?? '', [Validators.required, Validators.maxLength(100)]],
      message: [data?.message ?? '', Validators.required]
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const req = this.isEdit
      ? this.http.put(`${environment.apiUrl}/announcement/${this.data!.announcementId}`, this.form.value)
      : this.http.post(`${environment.apiUrl}/announcement`, this.form.value);
    req.subscribe({
      next: () => { this.saving = false; this.dialogRef.close(true); },
      error: () => {
        this.saving = false;
        this.snackBar.open('Failed to save announcement. Please try again.', 'Close', { duration: 4000, panelClass: ['snack-error'] });
      }
    });
  }

  cancel(): void { this.dialogRef.close(false); }
}
