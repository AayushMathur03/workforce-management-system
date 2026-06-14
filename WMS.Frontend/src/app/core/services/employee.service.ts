import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateEmployeeDto, EmployeeResponseDto, UpdateEmployeeDto } from '../../models/wms.models';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAll(): Observable<EmployeeResponseDto[]> {
    return this.http.get<EmployeeResponseDto[]>(`${this.apiUrl}/Employee`);
  }

  getById(id: number): Observable<EmployeeResponseDto> {
    return this.http.get<EmployeeResponseDto>(`${this.apiUrl}/Employee/${id}`);
  }

  search(term: string): Observable<EmployeeResponseDto[]> {
    return this.http.get<EmployeeResponseDto[]>(`${this.apiUrl}/Employee/search?term=${term}`);
  }

  create(dto: CreateEmployeeDto): Observable<EmployeeResponseDto> {
    return this.http.post<EmployeeResponseDto>(`${this.apiUrl}/Employee`, dto);
  }

  update(id: number, dto: UpdateEmployeeDto): Observable<EmployeeResponseDto> {
    return this.http.put<EmployeeResponseDto>(`${this.apiUrl}/Employee/${id}`, dto);
  }

  deactivate(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/Employee/deactivate/${id}`, {});
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Employee/${id}`);
  }
}
