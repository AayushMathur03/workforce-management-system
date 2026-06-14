import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DepartmentService } from '../../core/services/department.service';
import { DepartmentDto } from '../../models/wms.models';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './departments.component.html',
  styles: []
})
export class DepartmentsComponent implements OnInit {
  private dialog = inject(MatDialog);
  private deptService = inject(DepartmentService);
  private snackBar = inject(MatSnackBar);

  public depts: DepartmentDto[] = [];
  public filteredDepts: DepartmentDto[] = [];
  public pagedDepts: DepartmentDto[] = [];
  public isLoading = false;

  public searchControl = new FormControl('');

  public pageSize = 10;
  public pageIndex = 0;

  ngOnInit(): void {
    this.loadData();
    this.searchControl.valueChanges.subscribe(() => {
      this.pageIndex = 0;
      this.applyFilters();
    });
  }

  private loadData(): void {
    this.isLoading = true;
    this.deptService.getAll().subscribe({
      next: (res) => {
        this.depts = res;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load departments:', err);
      }
    });
  }

  private applyFilters(): void {
    const term = (this.searchControl.value || '').toLowerCase().trim();
    this.filteredDepts = this.depts.filter(d => {
      return !term || 
        d.departmentName.toLowerCase().includes(term) ||
        (d.description && d.description.toLowerCase().includes(term));
    });
    this.updatePageSlice();
  }

  private updatePageSlice(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedDepts = this.filteredDepts.slice(startIndex, endIndex);
  }

  public onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePageSlice();
  }

  public openAddDialog(): void {
    const dialogRef = this.dialog.open(DepartmentDialogComponent, {
      width: '440px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) this.loadData();
    });
  }

  public openEditDialog(dept: DepartmentDto): void {
    const dialogRef = this.dialog.open(DepartmentDialogComponent, {
      width: '440px',
      data: { dept },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) this.loadData();
    });
  }

  public onDelete(id: number): void {
    if (confirm('Are you sure you want to delete this department?')) {
      this.isLoading = true;
      this.deptService.delete(id).subscribe({
        next: () => {
          this.snackBar.open('Department deleted successfully.', 'Close', {
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
// Department Dialog Component Definition
// ============================================================================
@Component({
  selector: 'app-department-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <div class="wms-dialog">
      <h2 mat-dialog-title>{{ isEditMode ? 'Edit Department' : 'Add Department' }}</h2>
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <mat-dialog-content class="mat-mdc-dialog-content">
          <div style="display: flex; flex-direction: column; gap: 12px; width: 380px; max-width: 100%;">
            <mat-form-field appearance="outline">
              <mat-label>Department Name</mat-label>
              <input matInput formControlName="departmentName" placeholder="Enter department name">
              @if (form.get('departmentName')?.hasError('required')) {
                <mat-error>Department name is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="3" placeholder="Brief description"></textarea>
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
export class DepartmentDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<DepartmentDialogComponent>);
  private data = inject<{ dept?: DepartmentDto }>(MAT_DIALOG_DATA, { optional: true });
  private deptService = inject(DepartmentService);
  private snackBar = inject(MatSnackBar);

  public form!: FormGroup;
  public isEditMode = false;
  public isLoading = false;

  ngOnInit(): void {
    this.isEditMode = !!this.data?.dept;
    const dept = this.data?.dept;

    this.form = this.fb.group({
      departmentName: [dept?.departmentName || '', [Validators.required, Validators.maxLength(100)]],
      description: [dept?.description || '', [Validators.maxLength(255)]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading = true;
    const dto = this.form.value;

    if (this.isEditMode && this.data?.dept) {
      this.deptService.update(this.data.dept.departmentId!, dto).subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open('Department updated!', 'Close', {
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
      this.deptService.create(dto).subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open('Department created!', 'Close', {
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
