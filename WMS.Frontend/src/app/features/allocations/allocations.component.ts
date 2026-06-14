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
import { ProjectAllocationService } from '../../core/services/project-allocation.service';
import { ProjectService } from '../../core/services/project.service';
import { EmployeeService } from '../../core/services/employee.service';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeProjectResponseDto, ProjectDto, EmployeeResponseDto } from '../../models/wms.models';

@Component({
  selector: 'app-allocations',
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
  templateUrl: './allocations.component.html',
  styles: []
})
export class AllocationsComponent implements OnInit {
  private dialog = inject(MatDialog);
  private allocationService = inject(ProjectAllocationService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  public allocations: EmployeeProjectResponseDto[] = [];
  public filteredAllocations: EmployeeProjectResponseDto[] = [];
  public pagedAllocations: EmployeeProjectResponseDto[] = [];
  public isLoading = false;

  public isAdmin = false;
  public isManager = false;
  public isEmployee = false;

  public searchControl = new FormControl('');
  public statusFilterControl = new FormControl('all');

  public pageSize = 10;
  public pageIndex = 0;

  ngOnInit(): void {
    this.isAdmin = this.authService.hasRole(['Admin']);
    this.isManager = this.authService.hasRole(['Manager']);
    this.isEmployee = !this.isAdmin && !this.isManager;

    this.loadData();

    this.searchControl.valueChanges.subscribe(() => {
      this.pageIndex = 0;
      this.applyFilters();
    });
    this.statusFilterControl.valueChanges.subscribe(() => {
      this.pageIndex = 0;
      this.applyFilters();
    });
  }

  private loadData(): void {
    this.isLoading = true;

    const request$ = this.isEmployee
      ? this.allocationService.getMyProjects()
      : this.allocationService.getAll();

    request$.subscribe({
      next: (res) => {
        this.allocations = res;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load project allocations:', err);
      }
    });
  }

  private applyFilters(): void {
    const term = (this.searchControl.value || '').toLowerCase().trim();
    const statusVal = this.statusFilterControl.value || 'all';

    this.filteredAllocations = this.allocations.filter(a => {
      const matchesSearch = !term || 
        a.projectName.toLowerCase().includes(term) ||
        a.employeeName.toLowerCase().includes(term);

      const matchesStatus = statusVal === 'all' ||
        (statusVal === 'active' && a.status === true) ||
        (statusVal === 'inactive' && a.status === false);

      return matchesSearch && matchesStatus;
    });

    this.updatePageSlice();
  }

  private updatePageSlice(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedAllocations = this.filteredAllocations.slice(startIndex, endIndex);
  }

  public onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePageSlice();
  }

  public openAssignDialog(): void {
    const dialogRef = this.dialog.open(AllocationDialogComponent, {
      width: '460px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) this.loadData();
    });
  }

  public onDeactivate(alloc: EmployeeProjectResponseDto): void {
    if (confirm(`Are you sure you want to deactivate project allocation for "${alloc.employeeName}" on project "${alloc.projectName}"?`)) {
      this.isLoading = true;
      this.allocationService.deactivate(alloc.allocationId).subscribe({
        next: () => {
          this.snackBar.open('Allocation deactivated successfully.', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
          this.loadData();
        },
        error: () => this.isLoading = false
      });
    }
  }
}

// ============================================================================
// Allocation Dialog Component Definition (Create Assignment)
// ============================================================================
@Component({
  selector: 'app-allocation-dialog',
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
      <h2 mat-dialog-title>Create Project Allocation</h2>
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <mat-dialog-content class="mat-mdc-dialog-content">
          <div style="display: flex; flex-direction: column; gap: 12px; width: 400px; max-width: 100%;">
            
            <mat-form-field appearance="outline">
              <mat-label>Select Project</mat-label>
              <mat-select formControlName="projectId">
                @for (proj of projects; track proj.projectId) {
                  <mat-option [value]="proj.projectId">{{ proj.projectName }} (Client: {{ proj.clientName || 'N/A' }})</mat-option>
                }
              </mat-select>
              @if (form.get('projectId')?.hasError('required')) {
                <mat-error>Project selection is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
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
                <mat-error>Assignment date is required</mat-error>
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
export class AllocationDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AllocationDialogComponent>);
  private projectService = inject(ProjectService);
  private employeeService = inject(EmployeeService);
  private allocationService = inject(ProjectAllocationService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  public form!: FormGroup;
  public projects: ProjectDto[] = [];
  public employees: EmployeeResponseDto[] = [];
  public isLoading = false;

  ngOnInit(): void {
    this.loadData();
    this.form = this.fb.group({
      projectId: ['', [Validators.required]],
      empId: ['', [Validators.required]],
      assignedOn: [new Date().toISOString().split('T')[0], [Validators.required]]
    });
  }

  private loadData(): void {
    // Load Active Projects
    this.projectService.getAll().subscribe({
      next: (res) => this.projects = res.filter(p => p.status === 'Active'),
      error: (err) => console.error('Failed to load active projects:', err)
    });

    // Load Active Employees
    this.employeeService.getAll().subscribe({
      next: (res) => this.employees = res.filter(e => e.status === 'Active'),
      error: (err) => console.error('Failed to load active employees:', err)
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading = true;
    const currentUser = this.authService.currentUserValue;
    const creator = currentUser ? currentUser.username : 'System';

    const dto = {
      empId: this.form.value.empId,
      projectId: this.form.value.projectId,
      assignedOn: this.form.value.assignedOn,
      createdBy: creator
    };

    this.allocationService.assign(dto).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Employee allocated to project successfully!', 'Close', {
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
}
