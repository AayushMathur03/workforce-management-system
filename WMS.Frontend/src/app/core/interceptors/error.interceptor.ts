import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError(err => {
      // Don't auto-logout for login failures (which return 401 Unauthorized but shouldn't clear state or redirect)
      const isLoginRequest = req.url.endsWith('/Auth/login');

      if ([401, 403].includes(err.status) && !isLoginRequest) {
        authService.logout();
      }

      // Extract error message
      const errorMsg = err.error?.message || err.error || err.statusText || 'An unexpected error occurred';
      
      snackBar.open(errorMsg, 'Close', {
        duration: 5000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });

      return throwError(() => err);
    })
  );
};
