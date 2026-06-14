import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../shared/services/auth.service';
import { environment } from '../../environments/environment';
import { AnnouncementFormDialogComponent } from './announcement-form-dialog/announcement-form-dialog.component';

export interface Announcement {
  announcementId: number;
  title: string;
  message: string;
  createdBy: number;
  createdOn: string;
  isActive: boolean;
}

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatDialogModule, MatSnackBarModule, MatProgressSpinnerModule, MatChipsModule
  ],
  templateUrl: './announcements.component.html',
  styleUrl: './announcements.component.scss'
})
export class AnnouncementsComponent implements OnInit {
  announcements: Announcement[] = [];
  loading = true;

  constructor(
    private http: HttpClient,
    public authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.http.get<Announcement[]>(`${environment.apiUrl}/announcement`).subscribe({
      next: (data) => { this.announcements = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  openAdd(): void {
    const ref = this.dialog.open(AnnouncementFormDialogComponent, { width: '520px', data: null });
    ref.afterClosed().subscribe(r => { if (r) { this.load(); this.showSnack('Announcement posted'); } });
  }

  openEdit(a: Announcement): void {
    const ref = this.dialog.open(AnnouncementFormDialogComponent, { width: '520px', data: a });
    ref.afterClosed().subscribe(r => { if (r) { this.load(); this.showSnack('Announcement updated'); } });
  }

  deactivate(a: Announcement): void {
    if (!confirm(`Deactivate "${a.title}"?`)) return;
    this.http.put(`${environment.apiUrl}/announcement/${a.announcementId}/deactivate`, {}).subscribe({
      next: () => { this.load(); this.showSnack('Announcement deactivated'); },
      error: () => this.showSnack('Action failed', true)
    });
  }

  delete(a: Announcement): void {
    if (!confirm(`Delete "${a.title}"?`)) return;
    this.http.delete(`${environment.apiUrl}/announcement/${a.announcementId}`).subscribe({
      next: () => { this.load(); this.showSnack('Announcement deleted'); },
      error: () => this.showSnack('Delete failed', true)
    });
  }

  private showSnack(msg: string, error = false): void {
    this.snackBar.open(msg, 'Close', { duration: 3000, panelClass: error ? ['snack-error'] : ['snack-success'] });
  }
}
