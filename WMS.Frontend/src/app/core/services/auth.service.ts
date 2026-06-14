import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, ChangePasswordDto } from '../../models/wms.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    const storedUser = localStorage.getItem('wms_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        // Validate token expiry
        if (new Date(user.expiry) > new Date()) {
          this.currentUserSubject.next(user);
        } else {
          this.logoutQuietly();
        }
      } catch {
        this.logoutQuietly();
      }
    }
  }

  public get currentUserValue(): LoginResponse | null {
    return this.currentUserSubject.value;
  }

  public login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/Auth/login`, credentials).pipe(
      tap(user => {
        // Set expiry locally to UtcNow + 8 hours as returned by backend
        localStorage.setItem('wms_user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  public logout(): void {
    this.logoutQuietly();
    this.router.navigate(['/login']);
  }

  private logoutQuietly(): void {
    localStorage.removeItem('wms_user');
    this.currentUserSubject.next(null);
  }

  public changePassword(dto: ChangePasswordDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/Auth/change-password`, dto);
  }

  // Parse claims from JWT
  public getDecodedToken(): any {
    const user = this.currentUserValue;
    if (!user || !user.token) return null;
    try {
      const payload = user.token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  // Resolves the role claim value from the active JWT
  public getUserRole(): string {
    const user = this.currentUserValue;
    if (user && user.role) return user.role; // Default from login response

    const decoded = this.getDecodedToken();
    if (!decoded) return 'Employee';

    // Check multiple possible claim names
    const roleClaim = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded['role'] || decoded['Role'];
    return roleClaim || 'Employee';
  }

  // Resolves the EmployeeId claim value from the active JWT
  public getEmployeeId(): number {
    const user = this.currentUserValue;
    if (user && user.employeeId) return user.employeeId;

    const decoded = this.getDecodedToken();
    if (!decoded) return 0;

    const empId = decoded['EmployeeId'] || decoded['employeeId'] || decoded['empId'];
    return empId ? parseInt(empId, 10) : 0;
  }

  // Check if current user has any of the expected roles
  public hasRole(expectedRoles: string[]): boolean {
    const userRole = this.getUserRole();
    return expectedRoles.some(r => r.toLowerCase() === userRole.toLowerCase());
  }

  // Check if current user is authenticated
  public isAuthenticated(): boolean {
    const user = this.currentUserValue;
    return !!user && new Date(user.expiry) > new Date();
  }
}
