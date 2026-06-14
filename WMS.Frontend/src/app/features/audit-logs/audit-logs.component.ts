import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuditLogService } from '../../core/services/audit-log.service';
import { AuditLogDto } from '../../models/wms.models';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatPaginatorModule,
    MatTooltipModule
  ],
  templateUrl: './audit-logs.component.html',
  styles: []
})
export class AuditLogsComponent implements OnInit {
  private auditService = inject(AuditLogService);

  public logs: AuditLogDto[] = [];
  public filteredLogs: AuditLogDto[] = [];
  public pagedLogs: AuditLogDto[] = [];
  public isLoading = false;

  public searchControl = new FormControl('');
  public entityFilterControl = new FormControl('all');

  public pageSize = 10;
  public pageIndex = 0;

  ngOnInit(): void {
    this.loadLogs();

    this.searchControl.valueChanges.subscribe(() => {
      this.pageIndex = 0;
      this.applyFilters();
    });

    this.entityFilterControl.valueChanges.subscribe(val => {
      this.pageIndex = 0;
      this.loadLogs(val || 'all');
    });
  }

  private loadLogs(entityFilter = 'all'): void {
    this.isLoading = true;

    const request$ = entityFilter === 'all'
      ? this.auditService.getAll()
      : this.auditService.getByEntity(entityFilter);

    request$.subscribe({
      next: (res) => {
        // Sort descending by log timestamp/ID by default so latest logs are at the top
        this.logs = res.sort((a, b) => b.auditId - a.auditId);
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load audit logs:', err);
      }
    });
  }

  private applyFilters(): void {
    const term = (this.searchControl.value || '').toLowerCase().trim();

    this.filteredLogs = this.logs.filter(l => {
      const matchesSearch = !term || 
        (l.action && l.action.toLowerCase().includes(term)) ||
        (l.recordId && l.recordId.toString().includes(term)) ||
        (l.createdBy && l.createdBy.toString().includes(term));

      return matchesSearch;
    });

    this.updatePageSlice();
  }

  private updatePageSlice(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedLogs = this.filteredLogs.slice(startIndex, endIndex);
  }

  public onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePageSlice();
  }
}
