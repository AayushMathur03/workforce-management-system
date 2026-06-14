import { Component, OnInit, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { forkJoin, Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { AnnouncementService } from '../../core/services/announcement.service';
import { EmployeeService } from '../../core/services/employee.service';
import { DashboardSummaryDto, AnnouncementDto, EmployeeResponseDto } from '../../models/wms.models';

// Register Chart.js modules
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private announcementService = inject(AnnouncementService);
  private employeeService = inject(EmployeeService);

  public username = '';
  public role = '';
  public summary: DashboardSummaryDto | null = null;
  public announcements: AnnouncementDto[] = [];
  private employees: EmployeeResponseDto[] = [];

  private attendanceChart: Chart | null = null;
  private deptChart: Chart | null = null;
  private dataSubscription!: Subscription;

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    this.username = currentUser?.username || 'User';
    this.role = this.authService.getUserRole();

    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
    this.destroyCharts();
  }

  private loadData(): void {
    // Load summary, announcements, and employees in parallel
    this.dataSubscription = forkJoin({
      summary: this.dashboardService.getSummary(),
      announcements: this.announcementService.getActive(),
      employees: this.employeeService.getAll()
    }).subscribe({
      next: (res) => {
        this.summary = res.summary;
        this.announcements = res.announcements;
        this.employees = res.employees;

        // Initialize charts once data is loaded and DOM is updated
        setTimeout(() => {
          this.buildCharts();
        }, 100);
      },
      error: (err) => {
        console.error('Failed to load dashboard data:', err);
      }
    });
  }

  private buildCharts(): void {
    this.destroyCharts();

    const attendanceCanvas = document.getElementById('attendanceChart') as HTMLCanvasElement;
    const deptCanvas = document.getElementById('deptChart') as HTMLCanvasElement;

    if (attendanceCanvas && this.summary) {
      const present = this.summary.todayCheckIns;
      const absent = Math.max(0, this.summary.activeEmployees - present);

      this.attendanceChart = new Chart(attendanceCanvas, {
        type: 'doughnut',
        data: {
          labels: ['Present', 'Absent'],
          datasets: [{
            data: [present, absent],
            backgroundColor: ['#22c55e', '#ef4444'], // green, red
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                font: { size: 11 }
              }
            }
          },
          cutout: '65%'
        }
      });
    }

    if (deptCanvas && this.employees.length > 0) {
      // Calculate headcounts per department dynamically
      const deptCounts: { [key: string]: number } = {};
      this.employees.forEach(emp => {
        if (emp.status === 'Active') {
          const dept = emp.departmentName || 'Unassigned';
          deptCounts[dept] = (deptCounts[dept] || 0) + 1;
        }
      });

      const labels = Object.keys(deptCounts);
      const data = Object.values(deptCounts);

      this.deptChart = new Chart(deptCanvas, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: [
              '#3b82f6', // blue
              '#10b981', // green
              '#f59e0b', // amber
              '#8b5cf6', // purple
              '#ec4899', // pink
              '#f43f5e', // rose
              '#6b7280'  // gray
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                font: { size: 11 }
              }
            }
          }
        }
      });
    }
  }

  private destroyCharts(): void {
    if (this.attendanceChart) {
      this.attendanceChart.destroy();
      this.attendanceChart = null;
    }
    if (this.deptChart) {
      this.deptChart.destroy();
      this.deptChart = null;
    }
  }
}
