import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApplyLeaveDto, LeaveResponseDto, UpdateLeaveStatusDto } from '../../models/wms.models';

@Injectable({
  providedIn: 'root'
})
export class LeaveService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  apply(dto: ApplyLeaveDto): Observable<LeaveResponseDto> {
    return this.http.post<LeaveResponseDto>(`${this.apiUrl}/Leave/apply`, dto);
  }

  review(id: number, dto: UpdateLeaveStatusDto): Observable<LeaveResponseDto> {
    return this.http.put<LeaveResponseDto>(`${this.apiUrl}/Leave/${id}/review`, dto);
  }

  cancel(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/Leave/${id}`);
  }

  getMyLeaves(): Observable<LeaveResponseDto[]> {
    return this.http.get<LeaveResponseDto[]>(`${this.apiUrl}/Leave/my-leaves`);
  }

  getPending(): Observable<LeaveResponseDto[]> {
    return this.http.get<LeaveResponseDto[]>(`${this.apiUrl}/Leave/pending`);
  }

  getByEmployee(empId: number): Observable<LeaveResponseDto[]> {
    return this.http.get<LeaveResponseDto[]>(`${this.apiUrl}/Leave/employee/${empId}`);
  }
}
