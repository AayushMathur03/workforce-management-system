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
import { ClientService } from '../../core/services/client.service';
import { ClientDto } from '../../models/wms.models';

@Component({
  selector: 'app-clients',
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
  templateUrl: './clients.component.html',
  styles: []
})
export class ClientsComponent implements OnInit {
  private dialog = inject(MatDialog);
  private clientService = inject(ClientService);
  private snackBar = inject(MatSnackBar);

  public clients: ClientDto[] = [];
  public filteredClients: ClientDto[] = [];
  public pagedClients: ClientDto[] = [];
  public isLoading = false;

  public searchControl = new FormControl('');
  public statusFilterControl = new FormControl('all');

  public pageSize = 10;
  public pageIndex = 0;

  ngOnInit(): void {
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
    this.clientService.getAll().subscribe({
      next: (res) => {
        this.clients = res;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load clients:', err);
      }
    });
  }

  private applyFilters(): void {
    const term = (this.searchControl.value || '').toLowerCase().trim();
    const statusVal = this.statusFilterControl.value || 'all';

    this.filteredClients = this.clients.filter(c => {
      const matchesSearch = !term || 
        c.clientName.toLowerCase().includes(term) ||
        (c.clientLocation && c.clientLocation.toLowerCase().includes(term)) ||
        (c.clientAddress && c.clientAddress.toLowerCase().includes(term));

      const matchesStatus = statusVal === 'all' ||
        (statusVal === 'active' && c.status === true) ||
        (statusVal === 'inactive' && c.status === false);

      return matchesSearch && matchesStatus;
    });

    this.updatePageSlice();
  }

  private updatePageSlice(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedClients = this.filteredClients.slice(startIndex, endIndex);
  }

  public onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePageSlice();
  }

  public openAddDialog(): void {
    const dialogRef = this.dialog.open(ClientDialogComponent, {
      width: '480px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) this.loadData();
    });
  }

  public openEditDialog(client: ClientDto): void {
    const dialogRef = this.dialog.open(ClientDialogComponent, {
      width: '480px',
      data: { client },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) this.loadData();
    });
  }

  public onDeactivate(client: ClientDto): void {
    if (confirm(`Are you sure you want to deactivate ${client.clientName}?`)) {
      this.isLoading = true;
      this.clientService.deactivate(client.clientId!).subscribe({
        next: () => {
          this.snackBar.open('Client deactivated successfully.', 'Close', {
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

  public onDelete(id: number): void {
    if (confirm('Are you sure you want to permanently delete this client? This cannot be undone.')) {
      this.isLoading = true;
      this.clientService.delete(id).subscribe({
        next: () => {
          this.snackBar.open('Client deleted successfully.', 'Close', {
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
// Client Dialog Component Definition
// ============================================================================
@Component({
  selector: 'app-client-dialog',
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
      <h2 mat-dialog-title>{{ isEditMode ? 'Edit Client' : 'Add Client' }}</h2>
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <mat-dialog-content class="mat-mdc-dialog-content">
          <div style="display: flex; flex-direction: column; gap: 12px; width: 420px; max-width: 100%;">
            <mat-form-field appearance="outline">
              <mat-label>Client Name</mat-label>
              <input matInput formControlName="clientName" placeholder="Enter client company name">
              @if (form.get('clientName')?.hasError('required')) {
                <mat-error>Client name is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Location</mat-label>
              <input matInput formControlName="clientLocation" placeholder="e.g. London, New York">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Phone Number</mat-label>
              <input matInput type="number" formControlName="clientPhoneNumber" placeholder="Enter contact number">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Address</mat-label>
              <textarea matInput formControlName="clientAddress" rows="2" placeholder="Full address details"></textarea>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status">
                <mat-option [value]="true">Active</mat-option>
                <mat-option [value]="false">Inactive</mat-option>
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
export class ClientDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ClientDialogComponent>);
  private data = inject<{ client?: ClientDto }>(MAT_DIALOG_DATA, { optional: true });
  private clientService = inject(ClientService);
  private snackBar = inject(MatSnackBar);

  public form!: FormGroup;
  public isEditMode = false;
  public isLoading = false;

  ngOnInit(): void {
    this.isEditMode = !!this.data?.client;
    const client = this.data?.client;

    this.form = this.fb.group({
      clientName: [client?.clientName || '', [Validators.required, Validators.maxLength(100)]],
      clientLocation: [client?.clientLocation || '', [Validators.maxLength(100)]],
      clientPhoneNumber: [client?.clientPhoneNumber || null],
      clientAddress: [client?.clientAddress || '', [Validators.maxLength(255)]],
      status: [client !== undefined ? client.status : true, [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading = true;
    const dto = this.form.value;

    if (this.isEditMode && this.data?.client) {
      this.clientService.update(this.data.client.clientId!, dto).subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open('Client updated successfully!', 'Close', {
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
      this.clientService.create(dto).subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open('Client created successfully!', 'Close', {
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
