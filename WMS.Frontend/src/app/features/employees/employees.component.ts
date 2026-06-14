import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { EmployeeService } from '../../core/services/employee.service';
import { DepartmentService } from '../../core/services/department.service';
import { RoleService } from '../../core/services/role.service';
import { EmployeeResponseDto, DepartmentDto, Role } from '../../models/wms.models';
import { EmployeeFormDialogComponent } from './employee-form-dialog/employee-form-dialog.component';
import { HasRoleDirective } from '../../shared/directives/has-role.directive';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatDialogModule,
    HasRoleDirective
  ],
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.scss']
})
export class EmployeesComponent implements OnInit {
  private dialog = inject(MatDialog);
  private employeeService = inject(EmployeeService);
  private deptService = inject(DepartmentService);
  private roleService = inject(RoleService);
  private snackBar = inject(MatSnackBar);

  public employees: EmployeeResponseDto[] = [];
  public filteredEmployees: EmployeeResponseDto[] = [];
  public pagedEmployees: EmployeeResponseDto[] = [];
  
  public departments: DepartmentDto[] = [];
  public roles: Role[] = [];
  public isLoading = false;

  // Filter controls
  public searchControl = new FormControl('');
  public departmentFilter = new FormControl('');
  public roleFilter = new FormControl('');

  // Pagination parameters
  public pageSize = 10;
  public pageIndex = 0;

  ngOnInit(): void {
    this.loadData();
    this.setupFilters();
  }

  private loadData(): void {
    this.isLoading = true;
    forkJoin({
      emps: this.employeeService.getAll(),
      depts: this.deptService.getAll(),
      roles: this.roleService.getAll()
    }).subscribe({
      next: (res) => {
        this.employees = res.emps;
        this.departments = res.depts;
        this.roles = res.roles;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load employee list:', err);
      }
    });
  }

  private setupFilters(): void {
    this.searchControl.valueChanges.subscribe(() => {
      this.pageIndex = 0;
      this.applyFilters();
    });
    this.departmentFilter.valueChanges.subscribe(() => {
      this.pageIndex = 0;
      this.applyFilters();
    });
    this.roleFilter.valueChanges.subscribe(() => {
      this.pageIndex = 0;
      this.applyFilters();
    });
  }

  public applyFilters(): void {
    const searchTerm = (this.searchControl.value || '').toLowerCase().trim();
    const selectedDept = this.departmentFilter.value || '';
    const selectedRole = this.roleFilter.value || '';

    this.filteredEmployees = this.employees.filter(emp => {
      const matchesSearch = 
        emp.fullName.toLowerCase().includes(searchTerm) || 
        emp.email.toLowerCase().includes(searchTerm) ||
        emp.phoneNumber.includes(searchTerm);
      
      const matchesDept = !selectedDept || emp.departmentName === selectedDept;
      const matchesRole = !selectedRole || emp.roleName === selectedRole;

      return matchesSearch && matchesDept && matchesRole;
    });

    this.updatePageSlice();
  }

  public onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePageSlice();
  }

  private updatePageSlice(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedEmployees = this.filteredEmployees.slice(startIndex, endIndex);
  }

  public openAddDialog(): void {
    const dialogRef = this.dialog.open(EmployeeFormDialogComponent, {
      width: '640px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }

  public openEditDialog(employee: EmployeeResponseDto): void {
    const dialogRef = this.dialog.open(EmployeeFormDialogComponent, {
      width: '640px',
      data: { employee },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }

  public toggleEmployeeStatus(employee: EmployeeResponseDto): void {
    const isDeactivating = employee.status === 'Active';
    const actionText = isDeactivating ? 'deactivate' : 'activate';
    
    if (confirm(`Are you sure you want to ${actionText} employee "${employee.fullName}"?`)) {
      this.isLoading = true;
      
      if (isDeactivating) {
        this.employeeService.deactivate(employee.employeeId).subscribe({
          next: () => {
            this.snackBar.open('Employee deactivated successfully!', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar'],
              horizontalPosition: 'right',
              verticalPosition: 'top'
            });
            this.loadData();
          },
          error: () => this.isLoading = false
        });
      } else {
        // To activate, we use the update endpoint to set status to 'Active'
        this.employeeService.update(employee.employeeId, { status: 'Active' }).subscribe({
          next: () => {
            this.snackBar.open('Employee activated successfully!', 'Close', {
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
}
