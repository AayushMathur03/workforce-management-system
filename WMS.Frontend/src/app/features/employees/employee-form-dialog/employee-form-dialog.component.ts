import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { DepartmentService } from '../../../core/services/department.service';
import { RoleService } from '../../../core/services/role.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { EmployeeResponseDto, DepartmentDto, Role } from '../../../models/wms.models';

@Component({
  selector: 'app-employee-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './employee-form-dialog.component.html',
  styleUrls: ['./employee-form-dialog.component.scss']
})
export class EmployeeFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<EmployeeFormDialogComponent>);
  private data = inject<{ employee?: EmployeeResponseDto }>(MAT_DIALOG_DATA, { optional: true });
  
  private deptService = inject(DepartmentService);
  private roleService = inject(RoleService);
  private employeeService = inject(EmployeeService);
  private snackBar = inject(MatSnackBar);

  public form!: FormGroup;
  public isEditMode = false;
  public isLoading = false;
  public hidePassword = true;

  public departments: DepartmentDto[] = [];
  public roles: Role[] = [];

  ngOnInit(): void {
    this.isEditMode = !!this.data?.employee;
    this.initForm();
    this.loadDependencies();
  }

  private initForm(): void {
    const emp = this.data?.employee;
    
    this.form = this.fb.group({
      firstName: [emp?.firstName || '', [Validators.required, Validators.maxLength(50)]],
      lastName: [emp?.lastName || '', [Validators.required, Validators.maxLength(50)]],
      email: [emp?.email || '', [Validators.required, Validators.email, Validators.maxLength(80)]],
      phoneNumber: [emp?.phoneNumber || '', [Validators.required, Validators.maxLength(15)]],
      gender: [emp?.gender || ''],
      dob: [emp?.dob ? new Date(emp.dob) : null, [Validators.required]],
      doj: [emp?.doj ? new Date(emp.doj) : null, [Validators.required]],
      departmentId: [null], // Set once loaded
      roleId: [null],       // Set once loaded
      status: [emp?.status || 'Active']
    });

    // Username and password only required for new employees
    if (!this.isEditMode) {
      this.form.addControl('username', this.fb.control('', [Validators.required, Validators.maxLength(50)]));
      this.form.addControl('password', this.fb.control('', [Validators.required, Validators.minLength(6)]));
    }
  }

  private loadDependencies(): void {
    this.isLoading = true;
    forkJoin({
      depts: this.deptService.getAll(),
      roles: this.roleService.getAll()
    }).subscribe({
      next: (res) => {
        this.departments = res.depts;
        this.roles = res.roles;

        // Map names back to IDs if editing
        const emp = this.data?.employee;
        if (emp && this.isEditMode) {
          const matchingDept = this.departments.find(d => d.departmentName === emp.departmentName);
          const matchingRole = this.roles.find(r => r.roleName === emp.roleName);
          
          this.form.patchValue({
            departmentId: matchingDept?.departmentId || null,
            roleId: matchingRole?.roleId || null
          });
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load form dependencies:', err);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading = true;
    const formValue = this.form.value;

    // Convert dates to YYYY-MM-DD local format strings before posting
    const payload = {
      ...formValue,
      dob: this.formatDate(formValue.dob),
      doj: this.formatDate(formValue.doj)
    };

    if (this.isEditMode && this.data?.employee) {
      const empId = this.data.employee.employeeId;
      this.employeeService.update(empId, payload).subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open('Employee updated successfully!', 'Close', {
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
      this.employeeService.create(payload).subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open('Employee created successfully!', 'Close', {
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

  private formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
