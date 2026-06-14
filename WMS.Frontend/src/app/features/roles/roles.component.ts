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
import { RoleService } from '../../core/services/role.service';
import { Role } from '../../models/wms.models';

@Component({
  selector: 'app-roles',
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
  templateUrl: './roles.component.html',
  styles: []
})
export class RolesComponent implements OnInit {
  private dialog = inject(MatDialog);
  private roleService = inject(RoleService);
  private snackBar = inject(MatSnackBar);

  public roles: Role[] = [];
  public filteredRoles: Role[] = [];
  public pagedRoles: Role[] = [];
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
    this.roleService.getAll().subscribe({
      next: (res) => {
        this.roles = res;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load roles:', err);
      }
    });
  }

  private applyFilters(): void {
    const term = (this.searchControl.value || '').toLowerCase().trim();
    this.filteredRoles = this.roles.filter(r => {
      return !term || 
        r.roleName.toLowerCase().includes(term) ||
        (r.description && r.description.toLowerCase().includes(term));
    });
    this.updatePageSlice();
  }

  private updatePageSlice(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedRoles = this.filteredRoles.slice(startIndex, endIndex);
  }

  public onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePageSlice();
  }

  public openAddDialog(): void {
    const dialogRef = this.dialog.open(RoleDialogComponent, {
      width: '440px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) this.loadData();
    });
  }

  public openEditDialog(role: Role): void {
    const dialogRef = this.dialog.open(RoleDialogComponent, {
      width: '440px',
      data: { role },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) this.loadData();
    });
  }

  public onDelete(id: number): void {
    if (confirm('Are you sure you want to delete this role?')) {
      this.isLoading = true;
      this.roleService.delete(id).subscribe({
        next: () => {
          this.snackBar.open('Role deleted successfully.', 'Close', {
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
// Role Dialog Component Definition
// ============================================================================
@Component({
  selector: 'app-role-dialog',
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
      <h2 mat-dialog-title>{{ isEditMode ? 'Edit Role' : 'Add Role' }}</h2>
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <mat-dialog-content class="mat-mdc-dialog-content">
          <div style="display: flex; flex-direction: column; gap: 12px; width: 380px; max-width: 100%;">
            <mat-form-field appearance="outline">
              <mat-label>Role Name</mat-label>
              <input matInput formControlName="roleName" placeholder="Enter role name">
              @if (form.get('roleName')?.hasError('required')) {
                <mat-error>Role name is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="3" placeholder="Role description"></textarea>
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
export class RoleDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<RoleDialogComponent>);
  private data = inject<{ role?: Role }>(MAT_DIALOG_DATA, { optional: true });
  private roleService = inject(RoleService);
  private snackBar = inject(MatSnackBar);

  public form!: FormGroup;
  public isEditMode = false;
  public isLoading = false;

  ngOnInit(): void {
    this.isEditMode = !!this.data?.role;
    const role = this.data?.role;

    this.form = this.fb.group({
      roleName: [role?.roleName || '', [Validators.required, Validators.maxLength(50)]],
      description: [role?.description || '', [Validators.maxLength(255)]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading = true;
    const dto = this.form.value;

    if (this.isEditMode && this.data?.role) {
      this.roleService.update(this.data.role.roleId!, dto).subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open('Role updated successfully!', 'Close', {
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
      this.roleService.create(dto).subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open('Role created successfully!', 'Close', {
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
