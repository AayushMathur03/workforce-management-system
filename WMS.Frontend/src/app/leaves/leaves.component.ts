import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { AuthService } from '../shared/services/auth.service';
import { environment } from '../../environments/environment';

interface Leave {
  leaveId: number;
  empId: number;
  employeeName: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: string;
  appliedOn: string;
}

@Component({
  selector: 'app-leaves',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatPaginatorModule,
    MatSortModule
  ],
  templateUrl: './leaves.component.html',
  styleUrl: './leaves.component.scss'
})
export class LeavesComponent implements OnInit {
  applyForm: FormGroup;
  myLeavesDataSource = new MatTableDataSource<Leave>([]);
  pendingLeavesDataSource = new MatTableDataSource<Leave>([]);
  loadingMy = false;
  loadingPending = false;
  submitting = false;

  myColumns = ['type', 'from', 'to', 'reason', 'status', 'actions'];
  pendingColumns = ['employee', 'type', 'from', 'to', 'reason', 'actions'];

  @ViewChild('myPaginator') myPaginator!: MatPaginator;
  @ViewChild('mySort') mySort!: MatSort;
  @ViewChild('pendingPaginator') pendingPaginator!: MatPaginator;
  @ViewChild('pendingSort') pendingSort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    public authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.applyForm = this.fb.group({
      empId: [this.authService.getEmployeeId()],
      leaveType: ['', Validators.required],
      reason: [''],
      fromDate: ['', Validators.required],
      toDate: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadMyLeaves();
    if (this.authService.isManagerOrAdmin()) this.loadPendingLeaves();
  }

  loadMyLeaves(): void {
    this.loadingMy = true;
    const empId = this.authService.getEmployeeId();
    this.http.get<Leave[]>(`${environment.apiUrl}/leave/employee/${empId}`).subscribe({
      next: (data) => {
        this.myLeavesDataSource.data = data;
        this.myLeavesDataSource.paginator = this.myPaginator;
        this.myLeavesDataSource.sort = this.mySort;
        this.loadingMy = false;
      },
      error: () => { this.loadingMy = false; }
    });
  }

  loadPendingLeaves(): void {
    this.loadingPending = true;
    this.http.get<Leave[]>(`${environment.apiUrl}/leave/pending`).subscribe({
      next: (data) => {
        this.pendingLeavesDataSource.data = data;
        this.pendingLeavesDataSource.paginator = this.pendingPaginator;
        this.pendingLeavesDataSource.sort = this.pendingSort;
        this.loadingPending = false;
      },
      error: () => { this.loadingPending = false; }
    });
  }

  applyLeave(): void {
    if (this.applyForm.invalid) return;
    this.submitting = true;
    this.http.post(`${environment.apiUrl}/leave/apply`, this.applyForm.value).subscribe({
      next: () => {
        this.submitting = false;
        this.applyForm.reset({ empId: this.authService.getEmployeeId() });
        this.showSnack('Leave applied successfully');
        this.loadMyLeaves();
      },
      error: (err) => {
        this.submitting = false;
        this.showSnack(err.error?.message ?? 'Failed to apply leave', true);
      }
    });
  }

  cancelLeave(leave: Leave): void {
    if (!confirm('Cancel this leave request?')) return;
    this.http.delete(`${environment.apiUrl}/leave/${leave.leaveId}`).subscribe({
      next: () => { this.showSnack('Leave cancelled'); this.loadMyLeaves(); },
      error: (err) => this.showSnack(err.error?.message ?? 'Cancel failed', true)
    });
  }

  updateStatus(leave: Leave, status: 'Approved' | 'Rejected'): void {
    const body = { status, approvedBy: this.authService.getEmployeeId() };
    this.http.put(`${environment.apiUrl}/leave/${leave.leaveId}/review`, body).subscribe({
      next: () => {
        this.showSnack(`Leave ${status}`);
        this.loadPendingLeaves();
        this.loadMyLeaves();
      },
      error: () => this.showSnack('Action failed', true)
    });
  }

  private showSnack(msg: string, error = false): void {
    this.snackBar.open(msg, 'Close', {
      duration: 3000,
      panelClass: error ? ['snack-error'] : ['snack-success']
    });
  }
}
