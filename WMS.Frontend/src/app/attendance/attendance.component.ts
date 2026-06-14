import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../shared/services/auth.service';
import { environment } from '../../environments/environment';

interface AttendanceRecord {
  attendanceId: number;
  empId: number;
  employeeName: string;
  checkIn: string;
  checkOut: string;
  totalHours: number;
  workMode: string;
  attendanceDate: string;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.scss'
})
export class AttendanceComponent implements OnInit {
  today = new Date();
  checkInForm: FormGroup;
  monthlyRecords: AttendanceRecord[] = [];
  loadingMonthly = false;
  checkingIn = false;
  checkingOut = false;
  loadingToday = false;
  searchTerm = '';

  todayRecord: AttendanceRecord | null = null;

  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();
  months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  displayedColumns = ['date', 'checkIn', 'checkOut', 'totalHours', 'workMode', 'status'];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    public authService: AuthService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {
    this.checkInForm = this.fb.group({
      empId: [this.authService.getEmployeeId(), Validators.required],
      workMode: ['WFO', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadTodayStatus();
    this.loadMonthly();
  }

  getLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getRecordDateString(dateStr: string): string {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
  }

  parseLocalDate(dateStr: string): Date {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date(dateStr);
  }

  loadTodayStatus(): void {
    const empId = this.authService.getEmployeeId();
    if (!empId) {
      this.loadingToday = false;
      return;
    }
    this.loadingToday = true;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    this.http.get<AttendanceRecord[]>(
      `${environment.apiUrl}/attendance/monthly/${empId}?month=${currentMonth}&year=${currentYear}`
    ).subscribe({
      next: (data) => {
        this.zone.run(() => {
          const todayStr = this.getLocalDateString(new Date());
          this.todayRecord = data.find(r => this.getRecordDateString(r.attendanceDate) === todayStr) || null;
          this.loadingToday = false;
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.loadingToday = false;
          this.cdr.markForCheck();
        });
      }
    });
  }

  checkIn(): void {
    const empId = this.authService.getEmployeeId();
    if (!empId) {
      this.showSnack('❌ Error: Employee ID not found. Please log in again.', true);
      return;
    }

    this.checkInForm.patchValue({ empId });
    if (this.checkInForm.invalid) return;

    this.checkingIn = true;
    this.http.post(`${environment.apiUrl}/attendance/checkin`, this.checkInForm.value).subscribe({
      next: () => {
        this.checkingIn = false;
        this.showSnack('✅ Checked in successfully!');
        this.loadTodayStatus();
        this.loadMonthly();
      },
      error: (err) => {
        this.checkingIn = false;
        const msg = err.status === 409
          ? 'You have already checked in today.'
          : err.status === 401
          ? 'Session expired. Please log in again.'
          : (err.error?.message ?? 'Check-in failed. Please try again.');
        this.showSnack(msg, true);
      }
    });
  }

  checkOut(): void {
    const empId = this.authService.getEmployeeId();
    if (!empId) {
      this.showSnack('❌ Error: Employee ID not found. Please log in again.', true);
      return;
    }

    this.checkingOut = true;
    // PUT with route param is robust and bypasses ASP.NET Core body model binding issues
    this.http.put(`${environment.apiUrl}/attendance/checkout/${empId}`, {}).subscribe({
      next: () => {
        this.checkingOut = false;
        this.showSnack('✅ Checked out successfully!');
        this.loadTodayStatus();
        this.loadMonthly();
      },
      error: (err) => {
        this.checkingOut = false;
        const msg = err.status === 409
          ? 'You have already checked out today.'
          : err.status === 404
          ? 'No check-in found for today. Please check in first.'
          : err.status === 401
          ? 'Session expired. Please log in again.'
          : (err.error?.message ?? 'Check-out failed. Please try again.');
        this.showSnack(msg, true);
      }
    });
  }

  loadMonthly(): void {
    const empId = this.authService.getEmployeeId();
    if (!empId) {
      this.loadingMonthly = false;
      return;
    }
    this.loadingMonthly = true;
    this.http.get<AttendanceRecord[]>(
      `${environment.apiUrl}/attendance/monthly/${empId}?month=${this.selectedMonth}&year=${this.selectedYear}`
    ).subscribe({
      next: (data) => {
        this.zone.run(() => {
          this.monthlyRecords = data || [];
          this.loadingMonthly = false;
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.loadingMonthly = false;
          this.cdr.markForCheck();
        });
      }
    });
  }

  get filteredMonthlyRecords(): AttendanceRecord[] {
    if (!this.searchTerm.trim()) {
      return this.monthlyRecords;
    }
    const term = this.searchTerm.toLowerCase().trim();
    return this.monthlyRecords.filter(r => {
      const dateStr = this.parseLocalDate(r.attendanceDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', weekday: 'short'
      }).toLowerCase();
      const checkInStr = r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).toLowerCase() : '';
      const checkOutStr = r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).toLowerCase() : '';
      const workMode = (r.workMode || '').toLowerCase();
      const status = r.checkOut ? 'completed' : 'in progress';

      return dateStr.includes(term) ||
             checkInStr.includes(term) ||
             checkOutStr.includes(term) ||
             workMode.includes(term) ||
             status.includes(term);
    });
  }

  get todayStatus(): 'Absent' | 'Checked In' | 'Checked Out' {
    if (!this.todayRecord) return 'Absent';
    return this.todayRecord.checkOut ? 'Checked Out' : 'Checked In';
  }

  get todayWorkingHours(): string {
    if (!this.todayRecord) return '-';
    if (this.todayRecord.checkOut) {
      return this.todayRecord.totalHours ? this.todayRecord.totalHours.toFixed(1) + ' hrs' : '-';
    }
    const checkIn = new Date(this.todayRecord.checkIn);
    const now = new Date();
    const diffMs = now.getTime() - checkIn.getTime();
    if (diffMs < 0) return '0.0 hrs';
    const diffHrs = diffMs / (1000 * 60 * 60);
    return diffHrs.toFixed(1) + ' hrs (In Progress)';
  }

  get totalWorkingHours(): number {
    return this.monthlyRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0);
  }

  getWeekdaysCount(month: number, year: number, upToDay?: number): number {
    let count = 0;
    const now = new Date();
    const isCurrentMonth = (now.getMonth() + 1 === month && now.getFullYear() === year);

    let endDay: number;
    if (isCurrentMonth && upToDay !== undefined) {
      endDay = Math.min(upToDay, new Date(year, month, 0).getDate());
    } else {
      endDay = new Date(year, month, 0).getDate();
    }

    for (let day = 1; day <= endDay; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
    }
    return count || 1;
  }

  get attendancePercentage(): number {
    const now = new Date();
    const isCurrentMonth = (now.getMonth() + 1 === this.selectedMonth && now.getFullYear() === this.selectedYear);

    let weekdays = 1;
    if (isCurrentMonth) {
      weekdays = this.getWeekdaysCount(this.selectedMonth, this.selectedYear, now.getDate());
    } else if (this.selectedYear < now.getFullYear() || (this.selectedYear === now.getFullYear() && this.selectedMonth < now.getMonth() + 1)) {
      weekdays = this.getWeekdaysCount(this.selectedMonth, this.selectedYear);
    } else {
      weekdays = this.getWeekdaysCount(this.selectedMonth, this.selectedYear);
    }

    const presentDays = this.monthlyRecords.length;
    const pct = (presentDays / weekdays) * 100;
    return Math.min(Math.round(pct), 100);
  }

  private showSnack(msg: string, error = false): void {
    this.snackBar.open(msg, 'Close', {
      duration: 3500,
      panelClass: error ? ['snack-error'] : ['snack-success']
    });
  }
}
