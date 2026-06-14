import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { AuthService } from '../shared/services/auth.service';
import { environment } from '../../environments/environment';
import { ProjectFormDialogComponent } from './project-form-dialog/project-form-dialog.component';
import { AssignEmployeeDialogComponent } from './assign-employee-dialog/assign-employee-dialog.component';

export interface Project {
  projectId: number;
  projectName: string;
  clientId: number;
  clientName: string;
  startDate: string;
  endDate: string;
  status: string;
}

@Component({
  selector: 'app-projects',
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
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatPaginatorModule,
    MatSortModule
  ],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent implements OnInit {
  dataSource = new MatTableDataSource<Project>([]);
  loading = true;
  displayedColumns = ['name', 'client', 'start', 'end', 'status', 'actions'];

  // Master-Detail State
  selectedProject: Project | null = null;
  allocations: any[] = [];
  loadingAllocations = false;
  allocationsDataSource = new MatTableDataSource<any>([]);
  allocColumns = ['employeeName', 'email', 'roleName', 'assignedOn', 'status', 'actions'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Status filter state
  activeStatusFilter: string = 'All';
  statusFilters = [
    { label: 'All', value: 'All' },
    { label: 'Active', value: 'Active' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Completed', value: 'Completed' }
  ];

  private allProjects: Project[] = [];

  constructor(
    private http: HttpClient,
    public authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.http.get<Project[]>(`${environment.apiUrl}/project`).subscribe({
      next: (data) => {
        Promise.resolve().then(() => {
          this.allProjects = data;
          this.applyStatusFilter();
          this.loading = false;
          this.cdr.markForCheck();
        });
      },
      error: () => {
        Promise.resolve().then(() => {
          this.loading = false;
          this.cdr.markForCheck();
        });
      }
    });
  }

  applyFilter(value: string): void {
    this.dataSource.filter = value.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  setStatusFilter(status: string): void {
    this.activeStatusFilter = status;
    this.applyStatusFilter();
  }

  private applyStatusFilter(): void {
    const filtered = this.activeStatusFilter === 'All'
      ? this.allProjects
      : this.allProjects.filter(p => p.status === this.activeStatusFilter);
    this.dataSource.data = filtered;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  getStatusClass(status: string): string {
    if (!status) return '';
    const map: Record<string, string> = {
      'Active': 'status-active',
      'In Progress': 'status-inprogress',
      'Completed': 'status-completed',
      'Inactive': 'status-inactive'
    };
    return map[status] ?? 'status-pending';
  }

  viewDetails(project: Project): void {
    this.selectedProject = project;
    this.loadAllocations(project.projectId);
  }

  closeDetails(): void {
    this.selectedProject = null;
    this.allocations = [];
    this.allocationsDataSource.data = [];
    this.load();
  }

  loadAllocations(projectId: number): void {
    this.loadingAllocations = true;
    this.http.get<any[]>(`${environment.apiUrl}/project/${projectId}/allocations`).subscribe({
      next: (data) => {
        Promise.resolve().then(() => {
          this.allocations = data;
          this.allocationsDataSource.data = data;
          this.loadingAllocations = false;
          this.cdr.markForCheck();
        });
      },
      error: () => {
        Promise.resolve().then(() => {
          this.loadingAllocations = false;
          this.cdr.markForCheck();
        });
      }
    });
  }

  toggleAllocationStatus(alloc: any): void {
    const nextStatus = !alloc.status;
    const actionName = nextStatus ? 'reactivate' : 'deactivate';
    if (!confirm(`Are you sure you want to ${actionName} assignment of "${alloc.employeeName}"?`)) return;

    this.http.put(`${environment.apiUrl}/project/allocations/${alloc.allocationId}/status`, nextStatus).subscribe({
      next: () => {
        Promise.resolve().then(() => {
          this.showSnack(`Allocation successfully ${nextStatus ? 'reactivated' : 'deactivated'}`);
          this.loadAllocations(this.selectedProject!.projectId);
        });
      },
      error: (err) => {
        const errMsg = err.error?.message || err.message || 'Failed to update allocation status';
        this.showSnack(`Error: ${errMsg}`, true);
      }
    });
  }

  openAdd(): void {
    const ref = this.dialog.open(ProjectFormDialogComponent, { width: '500px', data: null });
    ref.afterClosed().subscribe(r => { if (r) { this.load(); this.showSnack('Project added'); } });
  }

  openEdit(project: Project): void {
    const ref = this.dialog.open(ProjectFormDialogComponent, { width: '500px', data: project });
    ref.afterClosed().subscribe(r => {
      if (r) {
        this.showSnack('Project updated');
        if (this.selectedProject && this.selectedProject.projectId === project.projectId) {
          // Fetch updated details for current project view
          this.http.get<Project>(`${environment.apiUrl}/project/${project.projectId}`).subscribe(updated => {
            Promise.resolve().then(() => {
              this.selectedProject = updated;
              this.load();
              this.cdr.markForCheck();
            });
          });
        } else {
          this.load();
        }
      }
    });
  }

  openAssign(project: Project): void {
    const ref = this.dialog.open(AssignEmployeeDialogComponent, { width: '450px', data: project });
    ref.afterClosed().subscribe(r => {
      if (r) {
        if (this.selectedProject && this.selectedProject.projectId === project.projectId) {
          this.loadAllocations(project.projectId);
        }
      }
    });
  }

  complete(project: Project): void {
    if (!confirm(`Mark "${project.projectName}" as Completed?`)) return;
    this.http.put(`${environment.apiUrl}/project/complete/${project.projectId}`, {}).subscribe({
      next: () => {
        Promise.resolve().then(() => {
          this.showSnack('Project marked as completed');
          if (this.selectedProject && this.selectedProject.projectId === project.projectId) {
            this.selectedProject.status = 'Completed';
          }
          this.load();
        });
      },
      error: () => this.showSnack('Action failed', true)
    });
  }

  delete(project: Project): void {
    if (!confirm(`Delete "${project.projectName}"?`)) return;
    this.http.delete(`${environment.apiUrl}/project/${project.projectId}`).subscribe({
      next: () => {
        Promise.resolve().then(() => {
          this.showSnack('Project deleted');
          if (this.selectedProject && this.selectedProject.projectId === project.projectId) {
            this.closeDetails();
          } else {
            this.load();
          }
        });
      },
      error: () => this.showSnack('Delete failed', true)
    });
  }

  private showSnack(msg: string, error = false): void {
    this.snackBar.open(msg, 'Close', { duration: 3000, panelClass: error ? ['snack-error'] : ['snack-success'] });
  }
}
