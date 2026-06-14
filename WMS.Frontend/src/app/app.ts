import { Component, OnInit, NgZone, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenav, MatSidenavModule, MatSidenavContainer } from '@angular/material/sidenav';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { AuthService } from './shared/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatSidenavModule, NavbarComponent, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  isMobile = false;
  sidebarCollapsed = false;

  @ViewChild('sidenav') sidenav!: MatSidenav;
  @ViewChild('sidenavContainer') sidenavContainer!: MatSidenavContainer;

  constructor(
    private breakpointObserver: BreakpointObserver,
    public authService: AuthService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.breakpointObserver.observe([Breakpoints.Handset, Breakpoints.Tablet]).subscribe(result => {
      this.zone.run(() => {
        Promise.resolve().then(() => {
          this.isMobile = result.matches;
          // Auto-collapse on mobile/tablet
          if (this.isMobile) {
            this.sidebarCollapsed = false;
          }
          this.cdr.markForCheck();
        });
      });
    });
  }

  /** Called by navbar hamburger — context-aware toggle */
  onToggleSidenav(): void {
    if (this.isMobile) {
      // Mobile: open/close the overlay drawer
      this.sidenav?.toggle();
    } else {
      // Desktop: collapse/expand icon-only sidebar
      this.sidebarCollapsed = !this.sidebarCollapsed;
      this.cdr.markForCheck();
    }
  }
}
