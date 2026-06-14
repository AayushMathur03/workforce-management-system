import { Component, OnInit, OnDestroy, ViewChild, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AuthService } from '../shared/services/auth.service';
import { environment } from '../../environments/environment';

// Matches WMS.Application.DTOs.AuditLog.AuditLogDto exactly
export interface AuditLog {
  auditId: number;
  entityName: string | null;
  recordId: number | null;
  action: string | null;
  createdBy: number | null;
  createdOn: string;
}

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
  ],
  templateUrl: './audit-logs.component.html',
  styleUrl: './audit-logs.component.scss',
})
export class AuditLogsComponent implements OnInit, OnDestroy {
  dataSource = new MatTableDataSource<AuditLog>([]);
  allLogs: AuditLog[] = [];
  loading = true;
  error: string | null = null;

  selectedEntity = 'ALL';
  searchTerm = '';

  // Entity types known to the system (matches backend EntityName values)
  entities = [
    'ALL',
    'Employee',
    'Attendance',
    'Leave',
    'Announcement',
    'UserLogin',
    'Department',
    'Role',
    'Client',
    'Project',
    'EmployeeProject',
  ];

  displayedColumns = ['auditId', 'entityName', 'recordId', 'action', 'createdBy', 'createdOn'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private http: HttpClient,
    public authService: AuthService,
    private snackBar: MatSnackBar,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (this.authService.isAdmin()) {
      this.loadLogs();
    } else {
      this.loading = false;
    }

    // Debounced text search
    this.searchSubject.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(term => {
      this.applyClientFilter(term, this.selectedEntity);
    });

    // Custom filter predicate for the MatTable
    this.dataSource.filterPredicate = (log: AuditLog, filter: string) => {
      const f = filter.toLowerCase();
      return (
        (log.entityName ?? '').toLowerCase().includes(f) ||
        (log.action ?? '').toLowerCase().includes(f) ||
        (log.createdBy?.toString() ?? '').includes(f) ||
        (log.recordId?.toString() ?? '').includes(f) ||
        (log.auditId?.toString() ?? '').includes(f)
      );
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Data Loading ────────────────────────────────────────────────────────────

  loadLogs(): void {
    this.loading = true;
    this.error = null;

    const url = this.selectedEntity !== 'ALL'
      ? `${environment.apiUrl}/auditlog/entity/${this.selectedEntity}`
      : `${environment.apiUrl}/auditlog`;

    this.http.get<AuditLog[]>(url)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.zone.run(() => {
            // Sort newest first
            this.allLogs = data.sort((a, b) =>
              new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime()
            );
            this.dataSource.data = this.allLogs;
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            // Re-apply text search if present
            if (this.searchTerm) {
              this.dataSource.filter = this.searchTerm.toLowerCase();
            }
            this.loading = false;
            this.cdr.markForCheck();
          });
        },
        error: () => {
          this.zone.run(() => {
            this.loading = false;
            this.error = 'Failed to load audit logs. Please try again.';
            this.cdr.markForCheck();
          });
        },
      });
  }

  // ─── Filter & Search ─────────────────────────────────────────────────────────

  onEntityChange(entity: string): void {
    this.selectedEntity = entity;
    this.loadLogs();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.searchSubject.next(term);
  }

  private applyClientFilter(term: string, _entity: string): void {
    this.dataSource.filter = term.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.dataSource.filter = '';
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // ─── Statistics ──────────────────────────────────────────────────────────────

  getTodayCount(): number {
    const today = new Date().toDateString();
    return this.allLogs.filter(l => new Date(l.createdOn).toDateString() === today).length;
  }

  getEntityCount(entity: string): number {
    return this.allLogs.filter(l =>
      (l.entityName ?? '').toLowerCase() === entity.toLowerCase()
    ).length;
  }

  // ─── UI Helpers ──────────────────────────────────────────────────────────────

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

  getActionClass(action: string | null): string {
    switch ((action ?? '').toLowerCase()) {
      case 'create':         return 'action-create';
      case 'update':         return 'action-update';
      case 'delete':         return 'action-delete';
      case 'deactivate':     return 'action-deactivate';
      case 'checkin':        return 'action-checkin';
      case 'checkout':       return 'action-checkout';
      case 'login':          return 'action-login';
      case 'passwordchange': return 'action-update';
      case 'approved':       return 'action-approved';
      case 'rejected':       return 'action-rejected';
      case 'cancel':
      case 'cancelled':      return 'action-cancelled';
      default:               return 'action-default';
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
      case 'passwordchange': return 'lock_reset';
      case 'approved':       return 'check_circle';
      case 'rejected':       return 'cancel';
      case 'cancel':
      case 'cancelled':      return 'cancel';
      default:               return 'info';
    }
  }

  trackByLog(_: number, log: AuditLog): number {
    return log.auditId;
  }
}
