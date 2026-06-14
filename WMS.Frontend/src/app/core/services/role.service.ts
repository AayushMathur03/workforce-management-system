import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Role } from '../../models/wms.models';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAll(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/Role`);
  }

  getById(id: number): Observable<Role> {
    return this.http.get<Role>(`${this.apiUrl}/Role/${id}`);
  }

  create(role: Role): Observable<Role> {
    return this.http.post<Role>(`${this.apiUrl}/Role`, role);
  }

  update(id: number, role: Role): Observable<Role> {
    return this.http.put<Role>(`${this.apiUrl}/Role/${id}`, role);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Role/${id}`);
  }
}
