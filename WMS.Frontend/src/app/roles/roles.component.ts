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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { AuthService } from '../shared/services/auth.service';
import { environment } from '../../environments/environment';

export interface Role {
  roleId: number;
  roleName: string;
  description: string;
}

@Component({
  selector: 'app-roles',
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
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatSortModule
  ],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss'
})
export class RolesComponent implements OnInit {
  dataSource = new MatTableDataSource<Role>([]);
  loading = true;
  submitting = false;
  showForm = false;
  editMode = false;
  selectedRoleId: number | null = null;
  roleForm: FormGroup;

  displayedColumns = ['roleId', 'roleName', 'description', 'actions'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    public authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.roleForm = this.fb.group({
      roleName: ['', Validators.required],
      description: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.loading = true;
    this.http.get<Role[]>(`${environment.apiUrl}/role`).subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showSnack('Failed to load roles', true);
      }
    });
  }

  onSubmit(): void {
    if (this.roleForm.invalid) return;
    this.submitting = true;

    if (this.editMode && this.selectedRoleId) {
      this.http.put(`${environment.apiUrl}/role/${this.selectedRoleId}`, this.roleForm.value).subscribe({
        next: () => {
          this.submitting = false;
          this.showSnack('Role updated successfully');
          this.cancelEdit();
          this.loadRoles();
        },
        error: () => {
          this.submitting = false;
          this.showSnack('Failed to update role', true);
        }
      });
    } else {
      this.http.post(`${environment.apiUrl}/role`, this.roleForm.value).subscribe({
        next: () => {
          this.submitting = false;
          this.showSnack('Role created successfully');
          this.cancelEdit();
          this.loadRoles();
        },
        error: () => {
          this.submitting = false;
          this.showSnack('Failed to create role', true);
        }
      });
    }
  }

  startAdd(): void {
    this.editMode = false;
    this.selectedRoleId = null;
    this.roleForm.reset();
    this.showForm = true;
  }

  startEdit(role: Role): void {
    this.editMode = true;
    this.selectedRoleId = role.roleId;
    this.roleForm.patchValue({
      roleName: role.roleName,
      description: role.description
    });
    this.showForm = true;
  }

  cancelEdit(): void {
    this.showForm = false;
    this.editMode = false;
    this.selectedRoleId = null;
    this.roleForm.reset();
  }

  deleteRole(role: Role): void {
    if (!confirm(`Are you sure you want to delete the role "${role.roleName}"?`)) return;
    
    this.http.delete(`${environment.apiUrl}/role/${role.roleId}`).subscribe({
      next: () => {
        this.showSnack('Role deleted successfully');
        this.loadRoles();
      },
      error: () => {
        this.showSnack('Failed to delete role. It may be assigned to employees.', true);
      }
    });
  }

  applyFilter(value: string): void {
    this.dataSource.filter = value.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  private showSnack(msg: string, error = false): void {
    this.snackBar.open(msg, 'Close', {
      duration: 3000,
      panelClass: error ? ['snack-error'] : ['snack-success']
    });
  }
}
