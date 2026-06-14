import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProjectService } from '../../core/services/project.service';
import { ClientService } from '../../core/services/client.service';
import { EmployeeService } from '../../core/services/employee.service';
import { AuthService } from '../../core/services/auth.service';
import { ProjectDto, ClientDto, EmployeeResponseDto, EmployeeProjectResponseDto } from '../../models/wms.models';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './projects.component.html',
  styles: []
})
export class ProjectsComponent implements OnInit {
  private dialog = inject(MatDialog);
  private projectService = inject(ProjectService);
  private clientService = inject(ClientService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  public projects: ProjectDto[] = [];
  public filteredProjects: ProjectDto[] = [];
  public pagedProjects: ProjectDto[] = [];
  public clients: ClientDto[] = [];
  public isLoading = false;

  public isAdmin = false;
  public isManager = false;

  public searchControl = new FormControl('');
  public clientFilterControl = new FormControl<any>('all');
  public statusFilterControl = new FormControl('all');

  public pageSize = 6;
  public pageIndex = 0;

  ngOnInit(): void {
    this.isAdmin = this.authService.hasRole(['Admin']);
    this.isManager = this.authService.hasRole(['Manager']);

    this.loadClients();
    this.loadProjects();

    this.searchControl.valueChanges.subscribe(() => {
      this.pageIndex = 0;
      this.applyFilters();
    });
    this.clientFilterControl.valueChanges.subscribe(() => {
      this.pageIndex = 0;
      this.applyFilters();
    });
    this.statusFilterControl.valueChanges.subscribe(() => {
      this.pageIndex = 0;
      this.applyFilters();
    });
  }

  private loadClients(): void {
    this.clientService.getAll().subscribe({
      next: (res) => this.clients = res,
      error: (err) => console.error('Failed to load clients:', err)
    });
  }

  private loadProjects(): void {
    this.isLoading = true;
    this.projectService.getAll().subscribe({
      next: (res) => {
        this.projects = res;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load projects:', err);
      }
    });
  }

  private applyFilters(): void {
    const term = (this.searchControl.value || '').toLowerCase().trim();
    const clientVal = this.clientFilterControl.value;
    const statusVal = this.statusFilterControl.value;

    this.filteredProjects = this.projects.filter(p => {
      const matchesSearch = !term || p.projectName.toLowerCase().includes(term);
      const matchesClient = clientVal === 'all' || p.clientId === clientVal;
      const matchesStatus = statusVal === 'all' || p.status === statusVal;

      return matchesSearch && matchesClient && matchesStatus;
    });

    this.updatePageSlice();
  }

  private updatePageSlice(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedProjects = this.filteredProjects.slice(startIndex, endIndex);
  }

  public onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePageSlice();
  }

  public openAddDialog(): void {
    const dialogRef = this.dialog.open(ProjectDialogComponent, {
      width: '500px',
      data: { clients: this.clients },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) this.loadProjects();
    });
  }

  public openEditDialog(project: ProjectDto): void {
    const dialogRef = this.dialog.open(ProjectDialogComponent, {
      width: '500px',
      data: { project, clients: this.clients },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) this.loadProjects();
    });
  }

  public onComplete(project: ProjectDto): void {
    if (confirm(`Are you sure you want to mark project "${project.projectName}" as Completed?`)) {
      this.isLoading = true;
      this.projectService.complete(project.projectId!).subscribe({
        next: () => {
          this.snackBar.open('Project marked as completed.', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
          this.loadProjects();
        },
        error: () => this.isLoading = false
      });
    }
  }

  public onDelete(id: number): void {
    if (confirm('Are you sure you want to delete this project? This will remove related allocations as well.')) {
      this.isLoading = true;
      this.projectService.delete(id).subscribe({
        next: () => {
          this.snackBar.open('Project deleted successfully.', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
          this.loadProjects();
        },
        error: () => this.isLoading = false
      });
    }
  }

  public openAssignDialog(project: ProjectDto): void {
    const dialogRef = this.dialog.open(ProjectAssignDialogComponent, {
      width: '460px',
      data: { project },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.snackBar.open('Employee assigned successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      }
    });
  }

  public viewAllocations(project: ProjectDto): void {
    this.dialog.open(ProjectAllocationsDialogComponent, {
      width: '600px',
      data: { project }
    });
  }
}

// ============================================================================
// Project Dialog Component
// ============================================================================
@Component({
  selector: 'app-project-dialog',
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
      <h2 mat-dialog-title>{{ isEditMode ? 'Edit Project' : 'Add Project' }}</h2>
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <mat-dialog-content class="mat-mdc-dialog-content">
          <div style="display: flex; flex-direction: column; gap: 12px; width: 440px; max-width: 100%;">
            <mat-form-field appearance="outline">
              <mat-label>Project Name</mat-label>
              <input matInput formControlName="projectName" placeholder="Enter project name">
              @if (form.get('projectName')?.hasError('required')) {
                <mat-error>Project name is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Client</mat-label>
              <mat-select formControlName="clientId">
                <mat-option [value]="null">-- Select Client --</mat-option>
                @for (c of clients; track c.clientId) {
                  <mat-option [value]="c.clientId">{{ c.clientName }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <mat-form-field appearance="outline">
                <mat-label>Start Date</mat-label>
                <input matInput type="date" formControlName="startDate">
                @if (form.get('startDate')?.hasError('required')) {
                  <mat-error>Required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>End Date</mat-label>
                <input matInput type="date" formControlName="endDate">
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status">
                <mat-option value="Active">Active</mat-option>
                <mat-option value="Completed">Completed</mat-option>
              </mat-select>
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
  `
})
export class ProjectDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ProjectDialogComponent>);
  private data = inject<{ project?: ProjectDto; clients: ClientDto[] }>(MAT_DIALOG_DATA);
  private projectService = inject(ProjectService);
  private snackBar = inject(MatSnackBar);

  public form!: FormGroup;
  public isEditMode = false;
  public isLoading = false;
  public clients: ClientDto[] = [];

  ngOnInit(): void {
    this.clients = this.data.clients;
    this.isEditMode = !!this.data.project;
    const proj = this.data.project;

    // Dates mapped as YYYY-MM-DD for standard html type="date" input
    let startStr = '';
    if (proj?.startDate) {
      startStr = new Date(proj.startDate).toISOString().split('T')[0];
    }
    let endStr = '';
    if (proj?.endDate) {
      endStr = new Date(proj.endDate).toISOString().split('T')[0];
    }

    this.form = this.fb.group({
      projectName: [proj?.projectName || '', [Validators.required, Validators.maxLength(100)]],
      clientId: [proj?.clientId || null],
      startDate: [startStr || new Date().toISOString().split('T')[0], [Validators.required]],
      endDate: [endStr || null],
      status: [proj?.status || 'Active', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading = true;
    const formVal = this.form.value;

    // Construct backend DTO
    const dto: ProjectDto = {
      projectName: formVal.projectName,
      clientId: formVal.clientId || undefined,
      startDate: formVal.startDate,
      endDate: formVal.endDate || undefined,
      status: formVal.status
    };

    if (this.isEditMode && this.data.project) {
      this.projectService.update(this.data.project.projectId!, dto).subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open('Project updated successfully!', 'Close', {
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
      this.projectService.create(dto).subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open('Project created successfully!', 'Close', {
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

// ============================================================================
// Project Assign Dialog Component
// ============================================================================
@Component({
  selector: 'app-project-assign-dialog',
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
      <h2 mat-dialog-title>Assign Employee to Project</h2>
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <mat-dialog-content class="mat-mdc-dialog-content">
          <div style="display: flex; flex-direction: column; gap: 12px; width: 400px; max-width: 100%;">
            <p style="margin: 0; color: #475569; font-size: 14px;">
              Project: <strong style="color: #0f172a;">{{ project.projectName }}</strong>
            </p>

            <mat-form-field appearance="outline" style="margin-top: 8px;">
              <mat-label>Select Employee</mat-label>
              <mat-select formControlName="empId">
                @for (emp of employees; track emp.employeeId) {
                  <mat-option [value]="emp.employeeId">{{ emp.fullName }} ({{ emp.roleName || 'No Role' }})</mat-option>
                }
              </mat-select>
              @if (form.get('empId')?.hasError('required')) {
                <mat-error>Employee selection is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Assignment Date</mat-label>
              <input matInput type="date" formControlName="assignedOn">
              @if (form.get('assignedOn')?.hasError('required')) {
                <mat-error>Date is required</mat-error>
              }
            </mat-form-field>
          </div>
        </mat-dialog-content>
        <mat-dialog-actions class="mat-mdc-dialog-actions">
          <button mat-button type="button" (click)="onCancel()">Cancel</button>
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || isLoading" style="background-color: #3b82f6;">
            Assign
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `
})
export class ProjectAssignDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ProjectAssignDialogComponent>);
  private data = inject<{ project: ProjectDto }>(MAT_DIALOG_DATA);
  private employeeService = inject(EmployeeService);
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);

  public form!: FormGroup;
  public employees: EmployeeResponseDto[] = [];
  public project!: ProjectDto;
  public isLoading = false;

  ngOnInit(): void {
    this.project = this.data.project;
    this.loadEmployees();

    this.form = this.fb.group({
      empId: ['', [Validators.required]],
      assignedOn: [new Date().toISOString().split('T')[0], [Validators.required]]
    });
  }

  private loadEmployees(): void {
    this.employeeService.getAll().subscribe({
      next: (res) => this.employees = res.filter(e => e.status === 'Active'),
      error: (err) => console.error('Failed to load employees for assignment:', err)
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading = true;
    const currentUser = this.authService.currentUserValue;
    const creator = currentUser ? currentUser.username : 'System';

    const dto = {
      empId: this.form.value.empId,
      projectId: this.project.projectId!,
      assignedOn: this.form.value.assignedOn,
      createdBy: creator
    };

    this.projectService.assignEmployee(dto).subscribe({
      next: () => {
        this.isLoading = false;
        this.dialogRef.close(true);
      },
      error: () => this.isLoading = false
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

// ============================================================================
// Project Allocations Viewer Dialog
// ============================================================================
@Component({
  selector: 'app-project-allocations-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <div class="wms-dialog">
      <h2 mat-dialog-title>Allocations for {{ project.projectName }}</h2>
      <mat-dialog-content class="mat-mdc-dialog-content">
        @if (isLoading) {
          <div style="display: flex; justify-content: center; align-items: center; padding: 24px;">
            <mat-icon style="animation: spin 1.5s linear infinite; color: #3b82f6;">sync</mat-icon>
            <span style="margin-left: 8px;">Loading allocations...</span>
          </div>
        } @else {
          <div class="wms-table-container" style="max-height: 350px; overflow-y: auto;">
            <table style="width: 100%;">
              <thead>
                <tr>
                  <th>EMPLOYEE</th>
                  <th>ASSIGNED ON</th>
                  <th>STATUS</th>
                  @if (isAdmin || isManager) {
                    <th style="text-align: right;">ACTION</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (a of allocations; track a.allocationId) {
                  <tr>
                    <td style="font-weight: 600;">{{ a.employeeName }}</td>
                    <td>{{ a.assignedOn | date:'dd-MM-yyyy' }}</td>
                    <td>
                      <span class="status-badge" [ngClass]="a.status ? 'active' : 'inactive'">
                        {{ a.status ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    @if (isAdmin || isManager) {
                      <td style="text-align: right;">
                        @if (a.status) {
                          <button mat-flat-button color="warn" style="font-size: 11px; padding: 0 8px; line-height: 28px; background-color: #ef4444;" (click)="deactivateAllocation(a)">
                            Deactivate
                          </button>
                        } @else {
                          <span style="color: #94a3b8; font-size: 12px; font-style: italic;">Inactive</span>
                        }
                      </td>
                    }
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" style="text-align: center; color: #94a3b8; padding: 24px 0 !important;">
                      No employees allocated to this project.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </mat-dialog-content>
      <mat-dialog-actions class="mat-mdc-dialog-actions">
        <button mat-flat-button color="primary" mat-dialog-close style="background-color: #3b82f6;">Close</button>
      </mat-dialog-actions>
    </div>

    <style>
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    </style>
  `
})
export class ProjectAllocationsDialogComponent implements OnInit {
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private data = inject<{ project: ProjectDto }>(MAT_DIALOG_DATA);

  public project!: ProjectDto;
  public allocations: EmployeeProjectResponseDto[] = [];
  public isLoading = false;
  public isAdmin = false;
  public isManager = false;

  ngOnInit(): void {
    this.project = this.data.project;
    this.isAdmin = this.authService.hasRole(['Admin']);
    this.isManager = this.authService.hasRole(['Manager']);
    this.loadAllocations();
  }

  private loadAllocations(): void {
    this.isLoading = true;
    this.projectService.getAllocations(this.project.projectId!).subscribe({
      next: (res) => {
        this.allocations = res;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load project allocations:', err);
      }
    });
  }

  public deactivateAllocation(alloc: EmployeeProjectResponseDto): void {
    if (confirm(`Deactivate allocation for ${alloc.employeeName}?`)) {
      this.projectService.updateAllocationStatus(alloc.allocationId, false).subscribe({
        next: () => {
          this.snackBar.open('Allocation status updated.', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
          this.loadAllocations();
        },
        error: (err) => console.error('Failed to update allocation:', err)
      });
    }
  }
}
