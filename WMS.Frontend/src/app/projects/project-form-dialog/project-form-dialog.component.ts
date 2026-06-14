import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { Project } from '../projects.component';

interface Client { clientId: number; clientName: string; }

@Component({
  selector: 'app-project-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule, MatSnackBarModule],
  templateUrl: './project-form-dialog.component.html'
})
export class ProjectFormDialogComponent implements OnInit {
  form: FormGroup;
  clients: Client[] = [];
  isEdit: boolean;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private dialogRef: MatDialogRef<ProjectFormDialogComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: Project | null
  ) {
    this.isEdit = !!data;
    this.form = this.fb.group({
      projectName: [data?.projectName ?? '', Validators.required],
      clientId: [data?.clientId ?? ''],
      startDate: [data?.startDate ?? ''],
      endDate: [data?.endDate ?? ''],
      status: [data?.status ?? 'Active', Validators.required]
    });
  }

  ngOnInit(): void {
    this.http.get<Client[]>(`${environment.apiUrl}/client`).subscribe({
      next: (c) => { this.clients = c; },
      error: () => {}
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const req = this.isEdit
      ? this.http.put(`${environment.apiUrl}/project/${this.data!.projectId}`, this.form.value)
      : this.http.post(`${environment.apiUrl}/project`, this.form.value);
    req.subscribe({
      next: () => { this.saving = false; this.dialogRef.close(true); },
      error: () => {
        this.saving = false;
        this.snackBar.open('Failed to save project. Please try again.', 'Close', { duration: 4000, panelClass: ['snack-error'] });
      }
    });
  }

  cancel(): void { this.dialogRef.close(false); }
}
