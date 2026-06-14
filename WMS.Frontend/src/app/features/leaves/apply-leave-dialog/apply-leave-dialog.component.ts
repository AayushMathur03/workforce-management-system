import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { LeaveService } from '../../../core/services/leave.service';

@Component({
  selector: 'app-apply-leave-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './apply-leave-dialog.component.html',
  styles: []
})
export class ApplyLeaveDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ApplyLeaveDialogComponent>);
  private authService = inject(AuthService);
  private leaveService = inject(LeaveService);
  private snackBar = inject(MatSnackBar);

  public form!: FormGroup;
  public isLoading = false;

  ngOnInit(): void {
    this.form = this.fb.group({
      leaveType: ['', [Validators.required]],
      fromDate: [null, [Validators.required]],
      toDate: [null, [Validators.required]],
      reason: ['', [Validators.required, Validators.maxLength(255)]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading = true;
    const formValue = this.form.value;
    const myEmpId = this.authService.getEmployeeId();

    const payload = {
      empId: myEmpId,
      leaveType: formValue.leaveType,
      reason: formValue.reason,
      fromDate: this.formatDate(formValue.fromDate),
      toDate: this.formatDate(formValue.toDate)
    };

    this.leaveService.apply(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Leave application submitted successfully!', 'Close', {
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

  onCancel(): void {
    this.dialogRef.close(false);
  }

  private formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
