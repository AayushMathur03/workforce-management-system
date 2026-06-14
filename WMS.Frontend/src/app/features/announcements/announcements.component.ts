import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { AnnouncementService } from '../../core/services/announcement.service';
import { AnnouncementDto } from '../../models/wms.models';
import { AnnouncementDialogComponent } from './announcement-dialog/announcement-dialog.component';
import { HasRoleDirective } from '../../shared/directives/has-role.directive';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    HasRoleDirective
  ],
  templateUrl: './announcements.component.html',
  styles: []
})
export class AnnouncementsComponent implements OnInit {
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);
  private announcementService = inject(AnnouncementService);
  private snackBar = inject(MatSnackBar);

  public announcements: AnnouncementDto[] = [];
  public isLoading = false;
  public isAdmin = false;

  ngOnInit(): void {
    this.isAdmin = this.authService.hasRole(['Admin']);
    this.loadAnnouncements();
  }

  public loadAnnouncements(): void {
    this.isLoading = true;
    
    const obs$ = this.isAdmin 
      ? this.announcementService.getAll() 
      : this.announcementService.getActive();

    obs$.subscribe({
      next: (res) => {
        // Sort newest first
        this.announcements = res.sort((a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime());
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load announcements:', err);
      }
    });
  }

  public openAddDialog(): void {
    const dialogRef = this.dialog.open(AnnouncementDialogComponent, {
      width: '520px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAnnouncements();
      }
    });
  }

  public openEditDialog(announcement: AnnouncementDto): void {
    const dialogRef = this.dialog.open(AnnouncementDialogComponent, {
      width: '520px',
      data: { announcement },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAnnouncements();
      }
    });
  }

  public deactivateAnnouncement(id: number): void {
    if (confirm('Are you sure you want to deactivate this announcement? It will be hidden from staff.')) {
      this.isLoading = true;
      this.announcementService.deactivate(id).subscribe({
        next: () => {
          this.snackBar.open('Announcement deactivated.', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
          this.loadAnnouncements();
        },
        error: () => this.isLoading = false
      });
    }
  }

  public deleteAnnouncement(id: number): void {
    if (confirm('Are you sure you want to permanently delete this announcement?')) {
      this.isLoading = true;
      this.announcementService.delete(id).subscribe({
        next: () => {
          this.snackBar.open('Announcement deleted.', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
          this.loadAnnouncements();
        },
        error: () => this.isLoading = false
      });
    }
  }
}
