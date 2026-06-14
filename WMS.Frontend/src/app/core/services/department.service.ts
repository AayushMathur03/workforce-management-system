import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DepartmentDto } from '../../models/wms.models';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAll(): Observable<DepartmentDto[]> {
    return this.http.get<DepartmentDto[]>(`${this.apiUrl}/Department`);
  }

  getById(id: number): Observable<DepartmentDto> {
    return this.http.get<DepartmentDto>(`${this.apiUrl}/Department/${id}`);
  }

  create(dept: DepartmentDto): Observable<DepartmentDto> {
    return this.http.post<DepartmentDto>(`${this.apiUrl}/Department`, dept);
  }

  update(id: number, dept: DepartmentDto): Observable<DepartmentDto> {
    return this.http.put<DepartmentDto>(`${this.apiUrl}/Department/${id}`, dept);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Department/${id}`);
  }
}
