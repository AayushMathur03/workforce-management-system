import { Component, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { Client } from '../clients.component';

@Component({
  selector: 'app-client-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSnackBarModule
  ],
  templateUrl: './client-form-dialog.component.html'
})
export class ClientFormDialogComponent {
  form: FormGroup;
  isEdit: boolean;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private dialogRef: MatDialogRef<ClientFormDialogComponent>,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: Client | null
  ) {
    this.isEdit = !!data;
    this.form = this.fb.group({
      clientName: [data?.clientName ?? '', Validators.required],
      clientAddress: [data?.clientAddress ?? ''],
      clientPhoneNumber: [data?.clientPhoneNumber ?? '', Validators.required],
      clientLocation: [data?.clientLocation ?? ''],
      status: [data?.status ?? true]
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;

    const payload = {
      ...this.form.value,
      clientId: this.isEdit ? this.data!.clientId : 0
    };

    const req = this.isEdit
      ? this.http.put(`${environment.apiUrl}/client/${this.data!.clientId}`, payload)
      : this.http.post(`${environment.apiUrl}/client`, payload);

    req.subscribe({
      next: () => {
        Promise.resolve().then(() => {
          this.saving = false;
          this.dialogRef.close(true);
          this.cdr.markForCheck();
        });
      },
      error: (err) => {
        Promise.resolve().then(() => {
          this.saving = false;
          const errMsg = err.error?.message || err.message || 'An error occurred';
          this.snackBar.open(`Failed: ${errMsg}`, 'Close', {
            duration: 5000,
            panelClass: ['snack-error']
          });
          this.cdr.markForCheck();
        });
      }
    });
  }

  cancel(): void { this.dialogRef.close(false); }
}
