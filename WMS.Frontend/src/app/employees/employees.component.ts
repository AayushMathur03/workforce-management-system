import { Component, OnInit, AfterViewInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { forkJoin } from 'rxjs';
import { AuthService } from '../shared/services/auth.service';
import { environment } from '../../environments/environment';
import { EmployeeFormDialogComponent } from './employee-form-dialog/employee-form-dialog.component';

export interface Employee {
  employeeId: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  gender: string;
  dob: string;
  doj: string;
  departmentName: string;
  roleName: string;
  status: string;
}

@Component({
  selector: 'app-employees',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatPaginatorModule,
    MatSortModule
  ],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss'
})
export class EmployeesComponent implements OnInit, AfterViewInit {
  employees: Employee[] = [];
  dataSource = new MatTableDataSource<Employee>([]);
  loading = true;
  searchTerm = '';
  selectedDepartment = 'All';
  selectedRole = 'All';
  departments: string[] = [];
  roles: string[] = [];

  displayedColumns = ['serial', 'code', 'name', 'email', 'phone', 'department', 'role', 'status', 'actions'];

  @ViewChild(MatSort) sort!: MatSort;

  private sortReady = false;

  constructor(
    private http: HttpClient,
    public authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadFiltersData();
    this.loadEmployees();
  }

  ngAfterViewInit(): void {
    // Sort is now available — bind it and mark ready
    this.sortReady = true;
    if (!this.loading) {
      // Data was already loaded before view init (unlikely but handled)
      this.dataSource.sort = this.sort;
    }
  }

  loadFiltersData(): void {
    this.http.get<any[]>(`${environment.apiUrl}/department`).subscribe({
      next: (depts) => {
        this.departments = depts.map(d => d.departmentName);
        this.cdr.markForCheck();
      }
    });

    this.http.get<any[]>(`${environment.apiUrl}/role`).subscribe({
      next: (r) => {
        this.roles = r.map(x => x.roleName);
        this.cdr.markForCheck();
      }
    });
  }

  loadEmployees(): void {
    this.loading = true;
    this.cdr.markForCheck();
    const isManager = this.authService.getRole() === 'Manager';

    if (isManager) {
      forkJoin({
        employees: this.http.get<Employee[]>(`${environment.apiUrl}/employee`),
        allocations: this.http.get<any[]>(`${environment.apiUrl}/projectallocation/team-projects`)
      }).subscribe({
        next: (res) => {
          const managerId = this.authService.getEmployeeId();
          const managerProjectIds = res.allocations
            .filter(a => a.empId === managerId && a.status)
            .map(a => a.projectId);

          const teamEmpIds = new Set<number>();
          res.allocations.forEach(a => {
            if (managerProjectIds.includes(a.projectId) && a.status && a.empId !== managerId) {
              teamEmpIds.add(a.empId);
            }
          });

          this.employees = res.employees.filter(e => teamEmpIds.has(e.employeeId));
          this.loading = false;
          this.applyFilters();
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
    } else {
      this.http.get<Employee[]>(`${environment.apiUrl}/employee`).subscribe({
        next: (data) => {
          this.employees = data;
          this.loading = false;
          this.applyFilters();
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
    }
  }

  applyFilters(): void {
    let filtered = this.employees;

    if (this.searchTerm && this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      filtered = filtered.filter(e =>
        (e.fullName && e.fullName.toLowerCase().includes(term)) ||
        (e.email && e.email.toLowerCase().includes(term)) ||
        (e.phoneNumber && e.phoneNumber.toLowerCase().includes(term)) ||
        (`EMP${e.employeeId.toString().padStart(4, '0')}`.toLowerCase().includes(term))
      );
    }

    if (this.selectedDepartment && this.selectedDepartment !== 'All') {
      filtered = filtered.filter(e => e.departmentName === this.selectedDepartment);
    }

    if (this.selectedRole && this.selectedRole !== 'All') {
      filtered = filtered.filter(e => e.roleName === this.selectedRole);
    }

    this.dataSource.data = filtered;

    // Assign sort only after ViewChild is available
    if (this.sortReady && this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  openAddDialog(): void {
    const ref = this.dialog.open(EmployeeFormDialogComponent, {
      width: '680px',
      maxWidth: '95vw',
      data: { mode: 'add' }
    });
    ref.afterClosed().subscribe(result => {
      if (result) { this.loadEmployees(); this.showSnack('Employee added successfully'); }
    });
  }

  openEditDialog(employee: Employee): void {
    const ref = this.dialog.open(EmployeeFormDialogComponent, {
      width: '680px',
      maxWidth: '95vw',
      data: { mode: 'edit', employee }
    });
    ref.afterClosed().subscribe(result => {
      if (result) { this.loadEmployees(); this.showSnack('Employee updated successfully'); }
    });
  }

  deactivate(employee: Employee): void {
    if (!confirm(`Deactivate ${employee.fullName}?`)) return;
    this.http.put(`${environment.apiUrl}/employee/deactivate/${employee.employeeId}`, {}).subscribe({
      next: () => { this.loadEmployees(); this.showSnack('Employee deactivated'); },
      error: () => { this.showSnack('Failed to deactivate employee', true); }
    });
  }

  getInitials(name: string): string {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }

  getAvatarColor(name: string): string {
    if (!name) return '#007bff';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 40%)`;
  }

  private showSnack(msg: string, error = false): void {
    this.snackBar.open(msg, 'Close', {
      duration: 3000,
      panelClass: error ? ['snack-error'] : ['snack-success']
    });
  }
}
