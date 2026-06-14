import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { LeaveService } from '../../core/services/leave.service';
import { LeaveResponseDto } from '../../models/wms.models';
import { ApplyLeaveDialogComponent } from './apply-leave-dialog/apply-leave-dialog.component';
import { HasRoleDirective } from '../../shared/directives/has-role.directive';

@Component({
  selector: 'app-leaves',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    HasRoleDirective
  ],
  templateUrl: './leaves.component.html',
  styleUrls: []
})
export class LeavesComponent implements OnInit {
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);
  private leaveService = inject(LeaveService);
  private snackBar = inject(MatSnackBar);

  public myLeaves: LeaveResponseDto[] = [];
  public pendingLeaves: LeaveResponseDto[] = [];
  public isLoading = false;
  
  private myEmpId = 0;
  private isAdminOrManager = false;

  ngOnInit(): void {
    this.myEmpId = this.authService.getEmployeeId();
    this.isAdminOrManager = this.authService.hasRole(['Admin', 'Manager']);
    this.loadData();
  }

  public loadData(): void {
    this.isLoading = true;

    const myLeaves$ = this.leaveService.getMyLeaves().pipe(
      catchError(err => {
        console.error('Failed to load personal leaves:', err);
        return of([]);
      })
    );

    const pendingLeaves$ = this.isAdminOrManager 
      ? this.leaveService.getPending().pipe(
          catchError(err => {
            console.error('Failed to load pending leaves:', err);
            return of([]);
          })
        )
      : of([]);

    forkJoin({
      myLogs: myLeaves$,
      pendingLogs: pendingLeaves$
    }).subscribe({
      next: (res) => {
        // Sort newest first
        this.myLeaves = res.myLogs.sort((a, b) => new Date(b.appliedOn).getTime() - new Date(a.appliedOn).getTime());
        this.pendingLeaves = res.pendingLogs;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  public openApplyDialog(): void {
    const dialogRef = this.dialog.open(ApplyLeaveDialogComponent, {
      width: '520px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }

  public onCancelLeave(leaveId: number): void {
    if (confirm('Are you sure you want to cancel this leave application?')) {
      this.isLoading = true;
      this.leaveService.cancel(leaveId).subscribe({
        next: () => {
          this.snackBar.open('Leave application cancelled successfully.', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
          this.loadData();
        },
        error: () => {
          this.isLoading = false;
        }
      });
    }
  }

  public onReviewLeave(leaveId: number, status: 'Approved' | 'Rejected'): void {
    const actionText = status === 'Approved' ? 'approve' : 'reject';
    if (confirm(`Are you sure you want to ${actionText} this leave request?`)) {
      this.isLoading = true;
      const dto = {
        status: status,
        approvedBy: this.myEmpId
      };

      this.leaveService.review(leaveId, dto).subscribe({
        next: () => {
          this.snackBar.open(`Leave request has been ${status.toLowerCase()}!`, 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
          this.loadData();
        },
        error: () => {
          this.isLoading = false;
        }
      });
    }
  }
}
