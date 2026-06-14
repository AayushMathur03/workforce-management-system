import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../shared/services/auth.service';
import { environment } from '../../../environments/environment';
import { Project } from '../projects.component';

interface Role { roleId: number; roleName: string; }
interface Employee { employeeId: number; fullName: string; roleName?: string; }

@Component({
  selector: 'app-assign-employee-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule
  ],
  templateUrl: './assign-employee-dialog.component.html'
})
export class AssignEmployeeDialogComponent implements OnInit {
  form: FormGroup;
  roles: Role[] = [];
  allEmployees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  selectedRoleName: string = 'all';
  saving = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private dialogRef: MatDialogRef<AssignEmployeeDialogComponent>,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public project: Project
  ) {
    this.form = this.fb.group({
      empId: ['', Validators.required],
      projectId: [project.projectId],
      assignedOn: [new Date(), Validators.required],
      createdBy: [this.authService.getUsername()]
    });
  }

  ngOnInit(): void {
    this.http.get<Role[]>(`${environment.apiUrl}/role`).subscribe({
      next: (r) => {
        Promise.resolve().then(() => {
          this.roles = r;
          this.cdr.markForCheck();
        });
      },
      error: () => {}
    });

    this.http.get<any[]>(`${environment.apiUrl}/project/${this.project.projectId}/allocations`).subscribe({
      next: (allocs) => {
        this.http.get<Employee[]>(`${environment.apiUrl}/employee`).subscribe({
          next: (emps) => {
            Promise.resolve().then(() => {
              const activeEmpIds = allocs
                .filter(a => a.status === true)
                .map(a => a.empId);
              this.allEmployees = emps.filter(e => !activeEmpIds.includes(e.employeeId));
              this.applyFilter();
            });
          },
          error: () => {}
        });
      },
      error: () => {}
    });
  }

  onRoleFilterChange(roleName: string): void {
    this.selectedRoleName = roleName;
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.selectedRoleName === 'all') {
      this.filteredEmployees = this.allEmployees;
    } else {
      this.filteredEmployees = this.allEmployees.filter(e => e.roleName === this.selectedRoleName);
    }
    this.cdr.markForCheck();
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;

    const val = this.form.value;
    const body = {
      ...val,
      assignedOn: val.assignedOn instanceof Date ? val.assignedOn.toISOString() : val.assignedOn
    };

    this.http.post(`${environment.apiUrl}/project/assign`, body).subscribe({
      next: () => {
        Promise.resolve().then(() => {
          this.saving = false;
          this.snackBar.open('Resource allocated successfully', 'Close', { duration: 3000, panelClass: ['snack-success'] });
          this.dialogRef.close(true);
          this.cdr.markForCheck();
        });
      },
      error: (err) => {
        Promise.resolve().then(() => {
          this.saving = false;
          const errMsg = err.error?.message || err.message || 'Failed to allocate resource';
          this.snackBar.open(`Failed: ${errMsg}`, 'Close', { duration: 5000, panelClass: ['snack-error'] });
          this.cdr.markForCheck();
        });
      }
    });
  }

  cancel(): void { this.dialogRef.close(false); }
}
