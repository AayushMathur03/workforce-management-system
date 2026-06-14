import { Component, Inject, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Employee } from '../employees.component';

interface Department { departmentId: number; departmentName: string; }
interface Role { roleId: number; roleName: string; }
interface Manager { employeeId: number; fullName: string; }

@Component({
  selector: 'app-employee-form-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './employee-form-dialog.component.html'
})
export class EmployeeFormDialogComponent implements OnInit, OnDestroy {
  form: FormGroup;
  departments: Department[] = [];
  roles: Role[] = [];
  managers: Manager[] = [];
  isEdit: boolean;
  saving = false;
  loadingData = true;
  hidePassword = true;

  private usernameAutoPopulated = false;
  private emailSub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private dialogRef: MatDialogRef<EmployeeFormDialogComponent>,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { mode: 'add' | 'edit'; employee?: Employee }
  ) {
    this.isEdit = data.mode === 'edit';
    this.form = this.fb.group({
      firstName: [data.employee?.firstName ?? '', Validators.required],
      lastName: [data.employee?.lastName ?? '', Validators.required],
      email: [data.employee?.email ?? '', [Validators.required, Validators.email]],
      phoneNumber: [data.employee?.phoneNumber ?? '', Validators.required],
      gender: [data.employee?.gender ?? ''],
      dob: [data.employee?.dob ? new Date(data.employee.dob) : null, Validators.required],
      doj: [data.employee?.doj ? new Date(data.employee.doj) : null, Validators.required],
      departmentId: [null, Validators.required],
      roleId: [null, Validators.required],
      managerId: [null],
      ...(this.isEdit ? { status: [data.employee?.status ?? 'Active'] } : {
        username: ['', Validators.required],
        password: ['', [Validators.required, Validators.minLength(6)]]
      })
    });
  }

  ngOnInit(): void {
    this.loadingData = true;

    const requests: { [k: string]: any } = {
      departments: this.http.get<Department[]>(`${environment.apiUrl}/department`),
      roles: this.http.get<Role[]>(`${environment.apiUrl}/role`),
    };

    if (!this.isEdit) {
      requests['employees'] = this.http.get<any[]>(`${environment.apiUrl}/employee`);
    }

    forkJoin(requests).subscribe({
      next: (res: any) => {
        this.departments = res.departments as Department[];
        this.roles = res.roles as Role[];

        if (!this.isEdit && res.employees) {
          this.managers = (res.employees as any[])
            .filter((e: any) => e.roleName === 'Manager')
            .map((e: any) => ({ employeeId: e.employeeId, fullName: e.fullName }));
        }

        if (this.isEdit && this.data.employee) {
          const dept = this.departments.find(x => x.departmentName === this.data.employee!.departmentName);
          if (dept) this.form.patchValue({ departmentId: dept.departmentId }, { emitEvent: false });

          const role = this.roles.find(x => x.roleName === this.data.employee!.roleName);
          if (role) this.form.patchValue({ roleId: role.roleId }, { emitEvent: false });
        }

        this.loadingData = false;
        this.cdr.markForCheck();

        if (!this.isEdit) {
          this.setupUsernameAutoGeneration();
        }
      },
      error: () => {
        this.loadingData = false;
        this.cdr.markForCheck();
        this.snackBar.open('Failed to load form data', 'Close', { duration: 3000, panelClass: ['snack-error'] });
      }
    });
  }

  ngOnDestroy(): void {
    this.emailSub?.unsubscribe();
  }

  private setupUsernameAutoGeneration(): void {
    this.emailSub = this.form.get('email')!.valueChanges.subscribe((email: string) => {
      if (!this.usernameAutoPopulated) {
        const derived = email ? email.split('@')[0].toLowerCase() : '';
        this.form.get('username')!.setValue(derived, { emitEvent: false, onlySelf: true });
        this.cdr.markForCheck();
      }
    });
  }

  onUsernameInput(): void {
    this.usernameAutoPopulated = true;
  }

  onUsernameClear(): void {
    const currentVal = this.form.get('username')!.value;
    if (!currentVal) {
      this.usernameAutoPopulated = false;
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }
    this.saving = true;
    this.cdr.markForCheck();

    const raw = this.form.getRawValue();
    const dobIso = raw.dob instanceof Date ? raw.dob.toISOString() : raw.dob;
    const dojIso = raw.doj instanceof Date ? raw.doj.toISOString() : raw.doj;
    const selectedManagerId: number | null = raw.managerId || null;

    let payload: any;
    if (this.isEdit) {
      payload = {
        firstName: raw.firstName,
        lastName: raw.lastName,
        phoneNumber: raw.phoneNumber,
        gender: raw.gender,
        departmentId: raw.departmentId,
        roleId: raw.roleId,
        status: raw.status
      };
    } else {
      const { managerId, ...rest } = raw;
      payload = { ...rest, dob: dobIso, doj: dojIso };
    }

    const emp = this.data.employee;
    const req = this.isEdit
      ? this.http.put(`${environment.apiUrl}/employee/${emp!.employeeId}`, payload)
      : this.http.post<any>(`${environment.apiUrl}/employee`, payload);

    req.subscribe({
      next: (createdEmployee: any) => {
        if (!this.isEdit && selectedManagerId && createdEmployee?.employeeId) {
          this.assignToManagerTeam(createdEmployee.employeeId, selectedManagerId);
        } else {
          this.saving = false;
          this.dialogRef.close(true);
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        this.saving = false;
        const errMsg = err.error?.message || err.message || 'An error occurred';
        this.snackBar.open(`Failed: ${errMsg}`, 'Close', { duration: 5000, panelClass: ['snack-error'] });
        this.cdr.markForCheck();
      }
    });
  }

  private assignToManagerTeam(newEmpId: number, managerId: number): void {
    this.http.get<any[]>(`${environment.apiUrl}/projectallocation/team-projects`).subscribe({
      next: (allocs) => {
        const managerAlloc = allocs.find(a => a.empId === managerId && a.status);
        const projectId = managerAlloc?.projectId ?? null;

        if (!projectId) {
          this.saving = false;
          this.dialogRef.close(true);
          this.cdr.markForCheck();
          return;
        }

        const allocationPayload = {
          empId: newEmpId,
          projectId: projectId,
          assignedOn: new Date().toISOString(),
          createdBy: 'admin'
        };

        this.http.post(`${environment.apiUrl}/ProjectAllocation`, allocationPayload).subscribe({
          next: () => {
            this.saving = false;
            this.dialogRef.close(true);
            this.cdr.markForCheck();
          },
          error: () => {
            this.saving = false;
            this.dialogRef.close(true);
            this.cdr.markForCheck();
          }
        });
      },
      error: () => {
        this.saving = false;
        this.dialogRef.close(true);
        this.cdr.markForCheck();
      }
    });
  }

  cancel(): void { this.dialogRef.close(false); }
}
