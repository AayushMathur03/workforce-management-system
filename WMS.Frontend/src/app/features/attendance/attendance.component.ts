import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AttendanceService } from '../../core/services/attendance.service';
import { EmployeeService } from '../../core/services/employee.service';
import { AttendanceResponseDto, EmployeeResponseDto } from '../../models/wms.models';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatTooltipModule
  ],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss']
})
export class AttendanceComponent implements OnInit {
  private authService = inject(AuthService);
  private attendanceService = inject(AttendanceService);
  private employeeService = inject(EmployeeService);
  private snackBar = inject(MatSnackBar);

  // My identities
  private myEmpId = 0;
  public isAdminOrManager = false;

  // Mark Attendance panel state
  public todayRecord: AttendanceResponseDto | null = null;
  public isLoading = false;
  public workModeControl = new FormControl('Work From Office');

  // Timesheet panel state
  public attendanceHistory: AttendanceResponseDto[] = [];
  public filteredAttendance: AttendanceResponseDto[] = [];
  public pagedAttendance: AttendanceResponseDto[] = [];
  public employees: EmployeeResponseDto[] = [];
  public isTableLoading = false;

  // Filter controls
  public searchControl = new FormControl('');
  public monthControl = new FormControl(new Date().getMonth() + 1);
  public yearControl = new FormControl(new Date().getFullYear());
  public employeeSelect = new FormControl(0);

  // Pagination parameters
  public pageSize = 10;
  public pageIndex = 0;

  // Statistics
  public presentDaysCount = 0;
  public totalHoursWorked = 0;
  public attendanceRate = 0;

  public months = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' }
  ];

  public years = [2026, 2025, 2024];

  ngOnInit(): void {
    this.myEmpId = this.authService.getEmployeeId();
    this.isAdminOrManager = this.authService.hasRole(['Admin', 'Manager']);
    this.employeeSelect.setValue(this.myEmpId);

    // Initial load
    this.loadTodayStatus();
    this.loadMonthlyAttendance();

    if (this.isAdminOrManager) {
      this.loadEmployeeList();
    }

    this.setupFilterSubscriptions();
  }

  private loadTodayStatus(): void {
    // Check if user has checked in today (current month/year)
    const today = new Date();
    this.attendanceService.getMonthly(this.myEmpId, today.getMonth() + 1, today.getFullYear()).subscribe({
      next: (logs) => {
        const todayStr = today.toISOString().split('T')[0];
        const record = logs.find(l => l.attendanceDate.startsWith(todayStr));
        if (record) {
          this.todayRecord = record;
          if (record.workMode) {
            this.workModeControl.setValue(record.workMode);
          }
        }
      }
    });
  }

  public loadMonthlyAttendance(): void {
    const empId = this.employeeSelect.value || this.myEmpId;
    const month = this.monthControl.value || (new Date().getMonth() + 1);
    const year = this.yearControl.value || new Date().getFullYear();

    this.isTableLoading = true;
    this.attendanceService.getMonthly(empId, month, year).subscribe({
      next: (logs) => {
        // Sort newest date first
        this.attendanceHistory = logs.sort((a, b) => new Date(b.attendanceDate).getTime() - new Date(a.attendanceDate).getTime());
        this.applyFilters();
        this.calculateStats();
        this.isTableLoading = false;
      },
      error: (err) => {
        this.isTableLoading = false;
        console.error('Failed to load monthly attendance:', err);
      }
    });
  }

  private loadEmployeeList(): void {
    this.employeeService.getAll().subscribe({
      next: (res) => {
        this.employees = res;
      }
    });
  }

  private setupFilterSubscriptions(): void {
    this.employeeSelect.valueChanges.subscribe(() => {
      this.pageIndex = 0;
      this.loadMonthlyAttendance();
    });
    this.monthControl.valueChanges.subscribe(() => {
      this.pageIndex = 0;
      this.loadMonthlyAttendance();
    });
    this.yearControl.valueChanges.subscribe(() => {
      this.pageIndex = 0;
      this.loadMonthlyAttendance();
    });
    this.searchControl.valueChanges.subscribe(() => {
      this.pageIndex = 0;
      this.applyFilters();
    });
  }

  private applyFilters(): void {
    const term = (this.searchControl.value || '').toLowerCase().trim();
    this.filteredAttendance = this.attendanceHistory.filter(log => {
      return !term || 
        (log.workMode && log.workMode.toLowerCase().includes(term)) ||
        (log.checkIn && log.checkIn.toLowerCase().includes(term));
    });
    this.updatePageSlice();
  }

  private calculateStats(): void {
    this.presentDaysCount = this.attendanceHistory.length;
    this.totalHoursWorked = this.attendanceHistory.reduce((sum, log) => sum + (log.totalHours || 0), 0);
    
    // Assume standard 22 working days in a month benchmark
    const workingDays = 22;
    this.attendanceRate = Math.min(100, (this.presentDaysCount / workingDays) * 100);
  }

  private updatePageSlice(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedAttendance = this.filteredAttendance.slice(startIndex, endIndex);
  }

  public onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePageSlice();
  }

  public onCheckIn(): void {
    this.isLoading = true;
    const dto = {
      empId: this.myEmpId,
      workMode: this.workModeControl.value || 'Work From Office'
    };

    this.attendanceService.checkIn(dto).subscribe({
      next: (res) => {
        this.todayRecord = res;
        this.snackBar.open('Checked in successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
        this.isLoading = false;
        
        // Reload details if viewing own timesheet
        if (this.employeeSelect.value === this.myEmpId) {
          this.loadMonthlyAttendance();
        }
      },
      error: () => this.isLoading = false
    });
  }

  public onCheckOut(): void {
    this.isLoading = true;
    this.attendanceService.checkOut(this.myEmpId).subscribe({
      next: (res) => {
        this.todayRecord = res;
        this.snackBar.open('Checked out successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
        this.isLoading = false;

        // Reload details if viewing own timesheet
        if (this.employeeSelect.value === this.myEmpId) {
          this.loadMonthlyAttendance();
        }
      },
      error: () => this.isLoading = false
    });
  }

  // Getters for status UI styling
  public get currentStatusText(): string {
    if (!this.todayRecord) return 'Absent';
    if (this.todayRecord.checkOut) return 'Checked Out';
    return this.todayRecord.workMode === 'Work From Office' ? 'Present (WFO)' : 'Present (WFH)';
  }

  public get currentStatusClass(): string {
    if (!this.todayRecord) return 'absent';
    if (this.todayRecord.checkOut) return 'inactive';
    return this.todayRecord.workMode === 'Work From Office' ? 'wfo' : 'wfh';
  }
}
