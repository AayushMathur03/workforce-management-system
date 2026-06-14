import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AssignEmployeeProjectDto, EmployeeProjectResponseDto } from '../../models/wms.models';

@Injectable({
  providedIn: 'root'
})
export class ProjectAllocationService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAll(): Observable<EmployeeProjectResponseDto[]> {
    return this.http.get<EmployeeProjectResponseDto[]>(`${this.apiUrl}/ProjectAllocation`);
  }

  assign(dto: AssignEmployeeProjectDto): Observable<EmployeeProjectResponseDto> {
    return this.http.post<EmployeeProjectResponseDto>(`${this.apiUrl}/ProjectAllocation`, dto);
  }

  getMyProjects(): Observable<EmployeeProjectResponseDto[]> {
    return this.http.get<EmployeeProjectResponseDto[]>(`${this.apiUrl}/ProjectAllocation/my-projects`);
  }

  getTeamProjects(): Observable<EmployeeProjectResponseDto[]> {
    return this.http.get<EmployeeProjectResponseDto[]>(`${this.apiUrl}/ProjectAllocation/team-projects`);
  }

  deactivate(allocationId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/ProjectAllocation/deactivate/${allocationId}`, {});
  }
}
