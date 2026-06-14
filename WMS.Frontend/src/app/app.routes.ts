import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { UnauthorizedComponent } from './features/auth/unauthorized/unauthorized.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { anonGuard } from './core/guards/anon.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [anonGuard] },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'employees',
        loadComponent: () => import('./features/employees/employees.component').then(m => m.EmployeesComponent),
        canActivate: [roleGuard],
        data: { expectedRoles: ['Admin', 'Manager'] }
      },
      {
        path: 'departments',
        loadComponent: () => import('./features/departments/departments.component').then(m => m.DepartmentsComponent),
        canActivate: [roleGuard],
        data: { expectedRoles: ['Admin'] }
      },
      {
        path: 'roles',
        loadComponent: () => import('./features/roles/roles.component').then(m => m.RolesComponent),
        canActivate: [roleGuard],
        data: { expectedRoles: ['Admin'] }
      },
      {
        path: 'clients',
        loadComponent: () => import('./features/clients/clients.component').then(m => m.ClientsComponent),
        canActivate: [roleGuard],
        data: { expectedRoles: ['Admin'] }
      },
      {
        path: 'projects',
        loadComponent: () => import('./features/projects/projects.component').then(m => m.ProjectsComponent)
      },
      {
        path: 'allocations',
        loadComponent: () => import('./features/allocations/allocations.component').then(m => m.AllocationsComponent),
        canActivate: [roleGuard],
        data: { expectedRoles: ['Admin', 'Manager'] }
      },
      {
        path: 'attendance',
        loadComponent: () => import('./features/attendance/attendance.component').then(m => m.AttendanceComponent)
      },
      {
        path: 'leaves',
        loadComponent: () => import('./features/leaves/leaves.component').then(m => m.LeavesComponent)
      },
      {
        path: 'announcements',
        loadComponent: () => import('./features/announcements/announcements.component').then(m => m.AnnouncementsComponent)
      },
      {
        path: 'audit-logs',
        loadComponent: () => import('./features/audit-logs/audit-logs.component').then(m => m.AuditLogsComponent),
        canActivate: [roleGuard],
        data: { expectedRoles: ['Admin'] }
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      }
    ]
  },
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: '**', redirectTo: 'dashboard' }
];
