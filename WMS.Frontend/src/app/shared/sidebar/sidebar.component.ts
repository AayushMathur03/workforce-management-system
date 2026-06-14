import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../services/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  roleCheck?: () => boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule, MatListModule, MatDividerModule, MatTooltipModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Output() closeSidenav = new EventEmitter<void>();

  get menuItems(): NavItem[] {
    return [
      { label: 'Dashboard',          route: '/dashboard',          icon: 'dashboard' },
      { label: this.authService.isAdmin() ? 'Employees' : 'My Team', route: '/employees', icon: 'people',               roleCheck: () => this.authService.isManagerOrAdmin() },
      { label: 'Departments',        route: '/departments',        icon: 'business',            roleCheck: () => this.authService.isManagerOrAdmin() },
      { label: 'Roles',              route: '/roles',              icon: 'admin_panel_settings', roleCheck: () => this.authService.isAdmin() },
      { label: 'Clients',            route: '/clients',            icon: 'handshake',           roleCheck: () => this.authService.isAdmin() },
      { label: 'Projects',           route: '/projects',           icon: 'work',                roleCheck: () => this.authService.isManagerOrAdmin() },
      { label: 'Project Allocation', route: '/project-allocation', icon: 'assignment_ind',      roleCheck: () => this.authService.isManagerOrAdmin() },
      { label: 'Attendance',         route: '/attendance',         icon: 'access_time' },
      { label: 'Leave Management',   route: '/leaves',             icon: 'event_busy' },
      { label: 'Announcements',      route: '/announcements',      icon: 'campaign' },
      { label: 'Audit Logs',         route: '/audit-logs',         icon: 'history',             roleCheck: () => this.authService.isAdmin() },
      { label: 'Profile',            route: '/profile',            icon: 'person' }
    ];
  }

  constructor(public authService: AuthService) {}

  onItemClick(): void {
    this.closeSidenav.emit();
  }
}
