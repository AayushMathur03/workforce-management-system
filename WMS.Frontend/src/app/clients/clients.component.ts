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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { AuthService } from '../shared/services/auth.service';
import { environment } from '../../environments/environment';
import { ClientFormDialogComponent } from './client-form-dialog/client-form-dialog.component';

export interface Client {
  clientId: number;
  clientName: string;
  clientAddress: string;
  clientPhoneNumber: number;
  clientLocation: string;
  status: boolean;
}

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatTableModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatDialogModule, MatSnackBarModule, MatProgressSpinnerModule,
    MatPaginatorModule, MatSortModule
  ],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss'
})
export class ClientsComponent implements OnInit {
  dataSource = new MatTableDataSource<Client>([]);
  loading = true;
  displayedColumns = ['name', 'phone', 'location', 'address', 'status', 'actions'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private http: HttpClient,
    public authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.http.get<Client[]>(`${environment.apiUrl}/client`).subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  openAdd(): void {
    const ref = this.dialog.open(ClientFormDialogComponent, { width: '500px', data: null });
    ref.afterClosed().subscribe(r => { if (r) { this.load(); this.showSnack('Client added'); } });
  }

  openEdit(client: Client): void {
    const ref = this.dialog.open(ClientFormDialogComponent, { width: '500px', data: client });
    ref.afterClosed().subscribe(r => { if (r) { this.load(); this.showSnack('Client updated'); } });
  }

  delete(client: Client): void {
    if (!confirm(`Deactivate "${client.clientName}"?`)) return;
    this.http.put(`${environment.apiUrl}/client/deactivate/${client.clientId}`, {}).subscribe({
      next: () => { this.load(); this.showSnack('Client deactivated'); },
      error: () => this.showSnack('Deactivate failed', true)
    });
  }

  applyFilter(value: string): void {
    this.dataSource.filter = value.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  private showSnack(msg: string, error = false): void {
    this.snackBar.open(msg, 'Close', { duration: 3000, panelClass: error ? ['snack-error'] : ['snack-success'] });
  }
}
