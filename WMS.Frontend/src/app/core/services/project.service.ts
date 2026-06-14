import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProjectDto, AssignEmployeeProjectDto, EmployeeProjectResponseDto } from '../../models/wms.models';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAll(): Observable<ProjectDto[]> {
    return this.http.get<ProjectDto[]>(`${this.apiUrl}/Project`);
  }

  getById(id: number): Observable<ProjectDto> {
    return this.http.get<ProjectDto>(`${this.apiUrl}/Project/${id}`);
  }

  create(dto: ProjectDto): Observable<ProjectDto> {
    return this.http.post<ProjectDto>(`${this.apiUrl}/Project`, dto);
  }

  update(id: number, dto: ProjectDto): Observable<ProjectDto> {
    return this.http.put<ProjectDto>(`${this.apiUrl}/Project/${id}`, dto);
  }

  complete(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/Project/complete/${id}`, {});
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Project/${id}`);
  }

  assignEmployee(dto: AssignEmployeeProjectDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/Project/assign`, dto);
  }

  getAllocations(projectId: number): Observable<EmployeeProjectResponseDto[]> {
    return this.http.get<EmployeeProjectResponseDto[]>(`${this.apiUrl}/Project/${projectId}/allocations`);
  }

  updateAllocationStatus(allocationId: number, status: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/Project/allocations/${allocationId}/status`, status);
  }
}
