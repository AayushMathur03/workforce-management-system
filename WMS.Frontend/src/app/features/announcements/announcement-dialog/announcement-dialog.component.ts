import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AnnouncementService } from '../../../core/services/announcement.service';
import { AuthService } from '../../../core/services/auth.service';
import { AnnouncementDto } from '../../../models/wms.models';

@Component({
  selector: 'app-announcement-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule
  ],
  template: `
    <div class="wms-dialog">
      <h2 mat-dialog-title>{{ isEditMode ? 'Edit Announcement' : 'New Announcement' }}</h2>
      
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <mat-dialog-content class="mat-mdc-dialog-content">
          <div style="display: flex; flex-direction: column; gap: 12px; width: 480px; max-width: 100%;">
            <mat-form-field appearance="outline">
              <mat-label>Title</mat-label>
              <input matInput formControlName="title" placeholder="Announcement Title">
              @if (form.get('title')?.hasError('required')) { <mat-error>Title is required</mat-error> }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Target Audience</mat-label>
              <mat-select formControlName="audience">
                <mat-option value="All">All Staff</mat-option>
                <mat-option value="Employee">Employees Only</mat-option>
                <mat-option value="Manager">Managers Only</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Message Content</mat-label>
              <textarea matInput formControlName="message" rows="5" placeholder="Enter announcement text..."></textarea>
              @if (form.get('message')?.hasError('required')) { <mat-error>Message is required</mat-error> }
            </mat-form-field>
          </div>
        </mat-dialog-content>
        
        <mat-dialog-actions class="mat-mdc-dialog-actions">
          <button mat-button type="button" (click)="onCancel()">Cancel</button>
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || isLoading" style="background-color: #3b82f6;">
            Save
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: []
})
export class AnnouncementDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AnnouncementDialogComponent>);
  private data = inject<{ announcement?: AnnouncementDto }>(MAT_DIALOG_DATA, { optional: true });
  
  private announcementService = inject(AnnouncementService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  public form!: FormGroup;
  public isEditMode = false;
  public isLoading = false;

  ngOnInit(): void {
    this.isEditMode = !!this.data?.announcement;
    const ann = this.data?.announcement;

    this.form = this.fb.group({
      title: [ann?.title || '', [Validators.required, Validators.maxLength(100)]],
      message: [ann?.message || '', [Validators.required]],
      audience: [ann?.audience || 'All', [Validators.required, Validators.maxLength(50)]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading = true;
    const formValue = this.form.value;
    const myEmpId = this.authService.getEmployeeId();

    const payload = {
      title: formValue.title,
      message: formValue.message,
      audience: formValue.audience,
      createdBy: myEmpId
    };

    if (this.isEditMode && this.data?.announcement) {
      this.announcementService.update(this.data.announcement.announcementId, payload).subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open('Announcement updated!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
          this.dialogRef.close(true);
        },
        error: () => this.isLoading = false
      });
    } else {
      this.announcementService.create(payload).subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open('Announcement published!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
          this.dialogRef.close(true);
        },
        error: () => this.isLoading = false
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
