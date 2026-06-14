import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Chart, registerables } from 'chart.js';
import { take } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from '../shared/services/auth.service';

// Dialog components for quick actions
import { EmployeeFormDialogComponent } from '../employees/employee-form-dialog/employee-form-dialog.component';
import { ProjectFormDialogComponent } from '../projects/project-form-dialog/project-form-dialog.component';
import { ClientFormDialogComponent } from '../clients/client-form-dialog/client-form-dialog.component';
import { AssignEmployeeDialogComponent } from '../projects/assign-employee-dialog/assign-employee-dialog.component';

Chart.register(...registerables);

interface DashboardSummary {
  totalEmployees: number;
  activeEmployees: number;
  todayCheckIns: number;
  pendingLeaves: number;
  activeProjects: number;
  totalDepartments: number;
  totalClients: number;
}

interface AuditLog {
  auditId: number;
  entityName: string | null;
  recordId: number | null;
  action: string | null;
  createdBy: number | null;
  createdOn: string;
}

interface LeaveRequest {
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

interface Announcement {
  announcementId: number;
  title: string;
  message: string;
  audience: string;
  createdOn: string;
  isActive: boolean;
}

interface Project {
  projectId: number;
  projectName: string;
  description: string;
  status: string;
  clientId: number;
  clientName: string;
}

interface Allocation {
  allocationId: number;
  empId: number;
  employeeName: string;
  projectId: number;
  projectName: string;
  assignedOn: string;
  status: boolean;
}

interface AttendanceRecord {
  attendanceId: number;
  empId: number;
  employeeName: string;
  checkIn: string;
  checkOut: string | null;
  totalHours: number | null;
  workMode: string;
  attendanceDate: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatTableModule,
    MatDividerModule,
    MatTooltipModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  role: string = '';
  username: string = '';
  employeeId: number = 0;
  loading = true;
  newDate = new Date();

  // Scoped Data Lists
  summary: DashboardSummary | null = null;
  announcements: Announcement[] = [];
  pendingLeaves: LeaveRequest[] = [];
  auditLogs: AuditLog[] = [];
  projects: Project[] = [];
  allocations: Allocation[] = [];
  
  // Employee Dashboard specific data
  myLeaves: LeaveRequest[] = [];
  myProjects: Allocation[] = [];
  myAttendance: AttendanceRecord[] = [];
  todayRecord: AttendanceRecord | null = null;
  checkingIn = false;
  checkingOut = false;
  selectedWorkMode = 'WFO';

  // Table Column definitions
  leaveColumns = ['employee', 'type', 'dates', 'reason', 'actions'];
  employeeLeaveColumns = ['type', 'dates', 'reason', 'status'];
  auditColumns = ['entity', 'action', 'user', 'date'];
  projectColumns = ['name', 'client', 'status', 'actions'];
  allocationColumns = ['project', 'assignedOn', 'status'];

  // Chart Management
  private charts: { [key: string]: Chart | null } = {};
  private employees: any[] = [];

  constructor(
    private http: HttpClient,
    public authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.role = this.authService.getRole();
    this.username = this.authService.getUsername();
    this.employeeId = this.authService.getEmployeeId();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  // ─── Data Loading ────────────────────────────────────────────────────────────

  loadDashboardData(): void {
    this.loading = true;
    this.destroyCharts();

    if (this.role === 'Admin') {
      this.loadAdminData();
    } else if (this.role === 'Manager') {
      this.loadManagerData();
    } else {
      this.loadEmployeeData();
    }
  }

  private loadAdminData(): void {
    forkJoin({
      summary: this.http.get<DashboardSummary>(`${environment.apiUrl}/dashboard/summary`).pipe(catchError(() => of(null))),
      announcements: this.http.get<Announcement[]>(`${environment.apiUrl}/announcement/active`).pipe(catchError(() => of([]))),
      leaves: this.http.get<LeaveRequest[]>(`${environment.apiUrl}/leave/pending`).pipe(catchError(() => of([]))),
      projects: this.http.get<Project[]>(`${environment.apiUrl}/project`).pipe(catchError(() => of([]))),
      employees: this.http.get<any[]>(`${environment.apiUrl}/employee`).pipe(catchError(() => of([]))),
      auditLogs: this.http.get<AuditLog[]>(`${environment.apiUrl}/auditlog`).pipe(catchError(() => of([])))
    }).subscribe({
      next: (res) => {
        this.summary = res.summary;
        this.announcements = (res.announcements as Announcement[]).slice(0, 3);
        this.pendingLeaves = (res.leaves as LeaveRequest[]).slice(0, 5);
        this.projects = (res.projects as Project[]).slice(0, 5);
        this.employees = res.employees as any[];
        this.auditLogs = (res.auditLogs as AuditLog[])
          .sort((a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime())
          .slice(0, 5);
        this.zone.run(() => {
          this.loading = false;
          setTimeout(() => this.renderCharts(), 0);
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.loading = false;
          this.cdr.markForCheck();
        });
      }
    });
  }

  private loadManagerData(): void {
    forkJoin({
      summary: this.http.get<DashboardSummary>(`${environment.apiUrl}/dashboard/summary`).pipe(catchError(() => of(null))),
      announcements: this.http.get<Announcement[]>(`${environment.apiUrl}/announcement/active`).pipe(catchError(() => of([]))),
      leaves: this.http.get<LeaveRequest[]>(`${environment.apiUrl}/leave/pending`).pipe(catchError(() => of([]))),
      allocations: this.http.get<Allocation[]>(`${environment.apiUrl}/projectallocation/team-projects`).pipe(catchError(() => of([])))
    }).subscribe({
      next: (res) => {
        this.summary = res.summary;
        this.announcements = (res.announcements as Announcement[]).slice(0, 3);
        this.pendingLeaves = (res.leaves as LeaveRequest[]).slice(0, 5);
        this.allocations = (res.allocations as Allocation[]).filter(a => a.status);
        this.zone.run(() => {
          this.loading = false;
          setTimeout(() => this.renderCharts(), 0);
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.loading = false;
          this.cdr.markForCheck();
        });
      }
    });
  }

  private loadEmployeeData(): void {
    forkJoin({
      myProjects: this.http.get<Allocation[]>(`${environment.apiUrl}/projectallocation/my-projects`).pipe(catchError(() => of([]))),
      myLeaves: this.http.get<LeaveRequest[]>(`${environment.apiUrl}/leave/my-leaves`).pipe(catchError(() => of([]))),
      announcements: this.http.get<Announcement[]>(`${environment.apiUrl}/announcement/active`).pipe(catchError(() => of([]))),
      attendance: this.http.get<AttendanceRecord[]>(`${environment.apiUrl}/attendance/my-attendance`).pipe(catchError(() => of([])))
    }).subscribe({
      next: (res) => {
        this.myProjects = res.myProjects as Allocation[];
        this.myLeaves = (res.myLeaves as LeaveRequest[]).sort((a, b) => new Date(b.appliedOn).getTime() - new Date(a.appliedOn).getTime());
        this.announcements = (res.announcements as Announcement[]).slice(0, 3);
        this.myAttendance = (res.attendance as AttendanceRecord[]) || [];
        const todayStr = this.getLocalDateString(new Date());
        this.todayRecord = this.myAttendance.find(r => r.attendanceDate.split('T')[0] === todayStr) || null;
        this.zone.run(() => {
          this.loading = false;
          setTimeout(() => this.renderCharts(), 0);
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.loading = false;
          this.cdr.markForCheck();
        });
      }
    });
  }

  // ─── Quick Actions & Operations ──────────────────────────────────────────────

  openAddEmployee(): void {
    const ref = this.dialog.open(EmployeeFormDialogComponent, {
      width: '600px',
      data: { mode: 'add' }
    });
    ref.afterClosed().pipe(take(1)).subscribe(res => {
      if (res) this.loadDashboardData();
    });
  }

  openCreateProject(): void {
    const ref = this.dialog.open(ProjectFormDialogComponent, {
      width: '500px',
      data: null
    });
    ref.afterClosed().pipe(take(1)).subscribe(res => {
      if (res) this.loadDashboardData();
    });
  }

  openAddClient(): void {
    const ref = this.dialog.open(ClientFormDialogComponent, {
      width: '500px',
      data: null
    });
    ref.afterClosed().pipe(take(1)).subscribe(res => {
      if (res) this.loadDashboardData();
    });
  }

  openAssignEmployee(proj: any): void {
    const ref = this.dialog.open(AssignEmployeeDialogComponent, {
      width: '450px',
      data: proj
    });
    ref.afterClosed().pipe(take(1)).subscribe(res => {
      if (res) this.loadDashboardData();
    });
  }

  reviewLeave(leave: LeaveRequest, status: 'Approved' | 'Rejected'): void {
    const body = { status, approvedBy: this.employeeId };
    this.http.put(`${environment.apiUrl}/leave/${leave.leaveId}/review`, body).subscribe({
      next: () => {
        this.snackBar.open(`Leave successfully ${status.toLowerCase()}`, 'Close', {
          duration: 3000,
          panelClass: ['snack-success']
        });
        this.loadDashboardData();
      },
      error: () => {
        this.snackBar.open('Failed to update leave request status', 'Close', {
          duration: 4000,
          panelClass: ['snack-error']
        });
      }
    });
  }

  // ─── Employee Live Attendance Toggle ─────────────────────────────────────────

  checkIn(): void {
    if (this.checkingIn) return;
    this.checkingIn = true;
    const body = {
      empId: this.employeeId,
      workMode: this.selectedWorkMode
    };
    this.http.post(`${environment.apiUrl}/attendance/checkin`, body).subscribe({
      next: () => {
        this.checkingIn = false;
        this.snackBar.open('✅ Checked in successfully!', 'Close', { duration: 3000, panelClass: ['snack-success'] });
        this.loadDashboardData();
      },
      error: (err) => {
        this.checkingIn = false;
        const msg = err.status === 409 ? 'Already checked in today.' : (err.error?.message ?? 'Check-in failed');
        this.snackBar.open(`❌ ${msg}`, 'Close', { duration: 3500, panelClass: ['snack-error'] });
      }
    });
  }

  checkOut(): void {
    if (this.checkingOut) return;
    this.checkingOut = true;
    this.http.put(`${environment.apiUrl}/attendance/checkout/${this.employeeId}`, {}).subscribe({
      next: () => {
        this.checkingOut = false;
        this.snackBar.open('✅ Checked out successfully!', 'Close', { duration: 3000, panelClass: ['snack-success'] });
        this.loadDashboardData();
      },
      error: (err) => {
        this.checkingOut = false;
        const msg = err.status === 404 ? 'No check-in record found for today.' : (err.error?.message ?? 'Check-out failed');
        this.snackBar.open(`❌ ${msg}`, 'Close', { duration: 3500, panelClass: ['snack-error'] });
      }
    });
  }

  // ─── Chart Rendering ─────────────────────────────────────────────────────────

  private renderCharts(): void {
    this.destroyCharts();

    if (this.role === 'Admin') {
      this.renderAdminCharts();
    } else if (this.role === 'Manager') {
      this.renderManagerCharts();
    } else {
      this.renderEmployeeCharts();
    }
  }

  private renderAdminCharts(): void {
    const deptCanvas = document.getElementById('deptChart') as HTMLCanvasElement;
    const overviewCanvas = document.getElementById('overviewChart') as HTMLCanvasElement;

    // 1. Workforce Overview Chart (Today's check-ins)
    if (overviewCanvas && this.summary) {
      const presentCount = this.summary.todayCheckIns;
      const absentCount = Math.max(0, this.summary.activeEmployees - this.summary.todayCheckIns);
      const leaveCount = this.summary.pendingLeaves; // approximate representation

      const ctx = overviewCanvas.getContext('2d');
      if (ctx) {
        this.charts['overview'] = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Checked In', 'Absent / Off', 'On Leave'],
            datasets: [{
              data: [presentCount, absentCount, leaveCount],
              backgroundColor: ['#10b981', '#4b5563', '#ef4444'],
              borderWidth: 0,
              hoverOffset: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { font: { family: 'Outfit', size: 12 } }
              }
            }
          }
        });
      }
    }

    // 2. Department Employee Distribution
    if (deptCanvas && this.employees.length > 0) {
      const counts: { [dept: string]: number } = {};
      this.employees.forEach(e => {
        const dept = e.departmentName || 'Unassigned';
        counts[dept] = (counts[dept] || 0) + 1;
      });

      const labels = Object.keys(counts);
      const data = Object.values(counts);

      const ctx = deptCanvas.getContext('2d');
      if (ctx && labels.length > 0) {
        this.charts['dept'] = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: labels,
            datasets: [{
              data: data,
              backgroundColor: ['#6366f1', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { font: { family: 'Outfit', size: 12 } }
              }
            }
          }
        });
      }
    }
  }

  private renderManagerCharts(): void {
    const attendanceCanvas = document.getElementById('teamAttendanceChart') as HTMLCanvasElement;
    const workloadCanvas = document.getElementById('teamWorkloadChart') as HTMLCanvasElement;

    // 1. Team Attendance Overview
    if (attendanceCanvas && this.summary) {
      const ctx = attendanceCanvas.getContext('2d');
      if (ctx) {
        const presentCount = this.summary.todayCheckIns;
        const absentCount = Math.max(0, this.summary.activeEmployees - this.summary.todayCheckIns);

        this.charts['teamAttendance'] = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Present Today', 'Absent / Out'],
            datasets: [{
              data: [presentCount, absentCount],
              backgroundColor: ['#10b981', '#374151'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { font: { family: 'Outfit', size: 12 } }
              }
            }
          }
        });
      }
    }

    // 2. Team Workload (Allocations by project)
    if (workloadCanvas && this.allocations.length > 0) {
      const projectCounts: { [project: string]: number } = {};
      this.allocations.forEach(a => {
        const proj = a.projectName || 'General';
        projectCounts[proj] = (projectCounts[proj] || 0) + 1;
      });

      const labels = Object.keys(projectCounts);
      const data = Object.values(projectCounts);

      const ctx = workloadCanvas.getContext('2d');
      if (ctx) {
        this.charts['workload'] = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Allocated Members',
              data: data,
              backgroundColor: '#a855f7',
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                ticks: { stepSize: 1 },
                grid: { color: 'rgba(0, 0, 0, 0.06)' }
              },
              x: {
                grid: { display: false }
              }
            },
            plugins: {
              legend: { display: false }
            }
          }
        });
      }
    }
  }

  private renderEmployeeCharts(): void {
    const hoursCanvas = document.getElementById('workHoursChart') as HTMLCanvasElement;
    const modeCanvas = document.getElementById('workModeChart') as HTMLCanvasElement;

    // 1. Weekly Work Hours Trend (Line Chart)
    if (hoursCanvas && this.myAttendance.length > 0) {
      const sortedHistory = [...this.myAttendance]
        .sort((a, b) => new Date(a.attendanceDate).getTime() - new Date(b.attendanceDate).getTime())
        .slice(-7); // show last 7 records

      const labels = sortedHistory.map(h => {
        const date = new Date(h.attendanceDate);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });

      const data = sortedHistory.map(h => h.totalHours || 0);

      const ctx = hoursCanvas.getContext('2d');
      if (ctx) {
        this.charts['hoursTrend'] = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Daily Working Hours',
              data: data,
              borderColor: '#6366f1',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              borderWidth: 2,
              fill: true,
              tension: 0.3,
              pointBackgroundColor: '#6366f1',
              pointRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                grid: { color: 'rgba(0, 0, 0, 0.06)' },
                title: { display: true, text: 'Hours Worked' }
              },
              x: {
                grid: { display: false }
              }
            },
            plugins: {
              legend: { display: false }
            }
          }
        });
      }
    }

    // 2. Work Mode Distribution (Doughnut Chart)
    if (modeCanvas && this.myAttendance.length > 0) {
      const modeCounts: { [mode: string]: number } = { 'WFO': 0, 'WFH': 0, 'Hybrid': 0 };
      this.myAttendance.forEach(a => {
        const m = a.workMode || 'WFO';
        if (modeCounts[m] !== undefined) {
          modeCounts[m]++;
        } else {
          modeCounts[m] = (modeCounts[m] || 0) + 1;
        }
      });

      const labels = Object.keys(modeCounts);
      const data = Object.values(modeCounts);

      const ctx = modeCanvas.getContext('2d');
      if (ctx) {
        this.charts['modeDist'] = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: labels,
            datasets: [{
              data: data,
              backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { font: { family: 'Outfit', size: 12 } }
              }
            }
          }
        });
      }
    }
  }

  private destroyCharts(): void {
    Object.keys(this.charts).forEach(key => {
      if (this.charts[key]) {
        this.charts[key]!.destroy();
        this.charts[key] = null;
      }
    });
  }

  // ─── Helper Methods ──────────────────────────────────────────────────────────

  getLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getLocalDateText(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr.split('T')[0]);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getAttendanceStatus(): string {
    if (!this.todayRecord) return 'Absent';
    return this.todayRecord.checkOut ? 'Checked Out' : 'Checked In';
  }

  getAttendancePulseColor(): string {
    const status = this.getAttendanceStatus();
    if (status === 'Checked In') return 'pulse-green';
    if (status === 'Checked Out') return 'pulse-amber';
    return 'pulse-red';
  }

  getMyAverageDailyHours(): string {
    if (this.myAttendance.length === 0) return '0.0 hrs';
    const total = this.myAttendance.reduce((sum, r) => sum + (r.totalHours || 0), 0);
    const avg = total / this.myAttendance.length;
    return avg.toFixed(1) + ' hrs';
  }

  getApprovedLeavesCount(): number {
    return this.myLeaves.filter(l => l.status === 'Approved').length;
  }

  getPendingLeavesCount(): number {
    return this.myLeaves.filter(l => l.status === 'Pending').length;
  }

  getEntityIcon(entityName: string | null): string {
    switch ((entityName ?? '').toLowerCase()) {
      case 'employee':        return 'badge';
      case 'attendance':      return 'access_time';
      case 'leave':           return 'event_busy';
      case 'announcement':    return 'campaign';
      case 'userlogin':       return 'login';
      case 'department':      return 'business';
      case 'role':            return 'admin_panel_settings';
      case 'client':          return 'handshake';
      case 'project':         return 'work';
      case 'employeeproject': return 'assignment_ind';
      default:                return 'storage';
    }
  }

  getActionIcon(action: string | null): string {
    switch ((action ?? '').toLowerCase()) {
      case 'create':         return 'add_circle';
      case 'update':         return 'edit';
      case 'delete':         return 'delete';
      case 'deactivate':     return 'block';
      case 'checkin':        return 'login';
      case 'checkout':       return 'logout';
      case 'login':          return 'key';
      default:               return 'info';
    }
  }

  getActionClass(action: string | null): string {
    return (action ?? '').toLowerCase();
  }
}
