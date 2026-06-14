import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditLogDto } from '../../models/wms.models';

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAll(): Observable<AuditLogDto[]> {
    return this.http.get<AuditLogDto[]>(`${this.apiUrl}/AuditLog`);
  }

  getByEntity(entityName: string): Observable<AuditLogDto[]> {
    return this.http.get<AuditLogDto[]>(`${this.apiUrl}/AuditLog/entity/${entityName}`);
  }
}
