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
import { Department } from '../departments.component';

@Component({
  selector: 'app-department-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSnackBarModule],
  templateUrl: './department-form-dialog.component.html'
})
export class DepartmentFormDialogComponent {
  form: FormGroup;
  isEdit: boolean;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private dialogRef: MatDialogRef<DepartmentFormDialogComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: Department | null
  ) {
    this.isEdit = !!data;
    this.form = this.fb.group({
      departmentName: [data?.departmentName ?? '', Validators.required],
      description: [data?.description ?? '']
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const req = this.isEdit
      ? this.http.put(`${environment.apiUrl}/department/${this.data!.departmentId}`, this.form.value)
      : this.http.post(`${environment.apiUrl}/department`, this.form.value);
    req.subscribe({
      next: () => { this.saving = false; this.dialogRef.close(true); },
      error: () => {
        this.saving = false;
        this.snackBar.open('Failed to save department. Please try again.', 'Close', { duration: 4000, panelClass: ['snack-error'] });
      }
    });
  }

  cancel(): void { this.dialogRef.close(false); }
}
