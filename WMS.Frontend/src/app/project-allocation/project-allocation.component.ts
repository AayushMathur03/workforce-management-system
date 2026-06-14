import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../shared/services/auth.service';
import { environment } from '../../environments/environment';

export interface Allocation {
  allocationId: number;
  empId: number;
  employeeName: string;
  projectId: number;
  projectName: string;
  assignedOn: string;
  status: boolean;
  createdBy: string;
}

export interface Employee {
  employeeId: number;
  fullName: string;
}

export interface Project {
  projectId: number;
  projectName: string;
}

@Component({
  selector: 'app-project-allocation',
  standalone: true,
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule
  ],
  templateUrl: './project-allocation.component.html',
  styleUrl: './project-allocation.component.scss'
})
export class ProjectAllocationComponent implements OnInit {
  dataSource = new MatTableDataSource<Allocation>([]);
  loading = true;
  submitting = false;
  showForm = false;
  allocForm: FormGroup;

  employees: Employee[] = [];
  projects: Project[] = [];

  displayedColumns: string[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    public authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.allocForm = this.fb.group({
      empId: ['', Validators.required],
      projectId: ['', Validators.required],
      assignedOn: [new Date(), Validators.required],
      createdBy: [this.authService.getUsername()]
    });
  }

  ngOnInit(): void {
    if (this.authService.isManagerOrAdmin()) {
      this.displayedColumns = ['employeeName', 'projectName', 'assignedOn', 'status', 'actions'];
      this.loadAllAllocations();
      this.loadEmployeesAndProjects();
    } else {
      this.displayedColumns = ['projectName', 'assignedOn', 'status'];
      this.loadMyAllocations();
    }
  }

  loadAllAllocations(): void {
    this.loading = true;
    this.http.get<Allocation[]>(`${environment.apiUrl}/ProjectAllocation`).subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showSnack('Failed to load project allocations', true);
      }
    });
  }

  loadMyAllocations(): void {
    this.loading = true;
    this.http.get<Allocation[]>(`${environment.apiUrl}/ProjectAllocation/my-projects`).subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showSnack('Failed to load your project allocations', true);
      }
    });
  }

  loadEmployeesAndProjects(): void {
    this.http.get<any[]>(`${environment.apiUrl}/employee`).subscribe({
      next: (data) => {
        this.employees = data.map(e => ({ employeeId: e.employeeId, fullName: e.fullName }));
      }
    });

    this.http.get<any[]>(`${environment.apiUrl}/project`).subscribe({
      next: (data) => {
        this.projects = data.filter(p => p.status === 'Active').map(p => ({ projectId: p.projectId, projectName: p.projectName }));
      }
    });
  }

  applyFilter(value: string): void {
    this.dataSource.filter = value.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getInitials(fullName: string): string {
    if (!fullName) return '';
    return fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  onSubmit(): void {
    if (this.allocForm.invalid) return;
    this.submitting = true;

    const body = {
      ...this.allocForm.value,
      assignedOn: new Date(this.allocForm.value.assignedOn).toISOString()
    };

    this.http.post(`${environment.apiUrl}/ProjectAllocation`, body).subscribe({
      next: () => {
        this.submitting = false;
        this.showSnack('Employee allocated to project successfully');
        this.cancelAdd();
        this.loadAllAllocations();
      },
      error: () => {
        this.submitting = false;
        this.showSnack('Failed to allocate employee', true);
      }
    });
  }

  deactivateAllocation(alloc: Allocation): void {
    if (!confirm(`Are you sure you want to end assignment of "${alloc.employeeName}" from "${alloc.projectName}"?`)) return;

    this.http.put(`${environment.apiUrl}/ProjectAllocation/deactivate/${alloc.allocationId}`, {}).subscribe({
      next: () => {
        this.showSnack('Allocation deactivated successfully');
        this.loadAllAllocations();
      },
      error: () => {
        this.showSnack('Failed to deactivate allocation', true);
      }
    });
  }

  startAdd(): void {
    this.allocForm.reset({
      assignedOn: new Date(),
      createdBy: this.authService.getUsername()
    });
    this.showForm = true;
  }

  cancelAdd(): void {
    this.showForm = false;
    this.allocForm.reset();
  }

  private showSnack(msg: string, error = false): void {
    this.snackBar.open(msg, 'Close', {
      duration: 3000,
      panelClass: error ? ['snack-error'] : ['snack-success']
    });
  }
}
