import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AttendanceResponseDto, CheckInDto } from '../../models/wms.models';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  checkIn(dto: CheckInDto): Observable<AttendanceResponseDto> {
    return this.http.post<AttendanceResponseDto>(`${this.apiUrl}/Attendance/checkin`, dto);
  }

  checkOut(empId: number): Observable<AttendanceResponseDto> {
    return this.http.put<AttendanceResponseDto>(`${this.apiUrl}/Attendance/checkout/${empId}`, {});
  }

  getMyAttendance(): Observable<AttendanceResponseDto[]> {
    return this.http.get<AttendanceResponseDto[]>(`${this.apiUrl}/Attendance/my-attendance`);
  }

  getMonthly(empId: number, month: number, year: number): Observable<AttendanceResponseDto[]> {
    return this.http.get<AttendanceResponseDto[]>(`${this.apiUrl}/Attendance/monthly/${empId}?month=${month}&year=${year}`);
  }

  getByEmployee(employeeId: number): Observable<AttendanceResponseDto[]> {
    return this.http.get<AttendanceResponseDto[]>(`${this.apiUrl}/Attendance/employee/${employeeId}`);
  }
}
