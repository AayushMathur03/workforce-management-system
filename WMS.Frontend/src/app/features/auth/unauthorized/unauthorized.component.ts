import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="unauthorized-container">
      <mat-card class="unauthorized-card">
        <mat-card-header>
          <div class="error-icon">
            <mat-icon>gpp_bad</mat-icon>
          </div>
        </mat-card-header>
        <mat-card-content>
          <h1>Access Denied</h1>
          <p>You do not have the required permissions to view this page.</p>
          <p class="sub-text">Please contact your administrator if you believe this is an error.</p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-flat-button color="primary" (click)="goHome()">Return to Dashboard</button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #f1f5f9;
      padding: 20px;
    }
    .unauthorized-card {
      max-width: 450px;
      width: 100%;
      padding: 30px;
      text-align: center;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    }
    .error-icon {
      width: 64px;
      height: 64px;
      background-color: #fee2e2;
      color: #ef4444;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px auto;
      mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
      }
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 8px 0;
    }
    p {
      color: #475569;
      font-size: 15px;
      margin: 0 0 6px 0;
    }
    .sub-text {
      font-size: 13px;
      color: #94a3b8;
      margin-bottom: 24px;
    }
    mat-card-actions {
      display: flex;
      justify-content: center;
      margin: 0;
      padding: 0;
    }
    button {
      padding: 0 24px;
      height: 40px;
      font-weight: 600;
      background-color: #3b82f6 !important;
    }
  `]
})
export class UnauthorizedComponent {
  private router = inject(Router);

  goHome(): void {
    this.router.navigate(['/dashboard']);
  }
}
