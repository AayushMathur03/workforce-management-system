import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRoles = route.data['expectedRoles'] as string[];

  if (authService.isAuthenticated()) {
    if (!expectedRoles || authService.hasRole(expectedRoles)) {
      return true;
    }
    router.navigate(['/unauthorized']);
    return false;
  }

  router.navigate(['/login']);
  return false;
};
