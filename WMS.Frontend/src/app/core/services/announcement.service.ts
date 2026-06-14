import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AnnouncementDto, CreateAnnouncementDto } from '../../models/wms.models';

@Injectable({
  providedIn: 'root'
})
export class AnnouncementService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAll(): Observable<AnnouncementDto[]> {
    return this.http.get<AnnouncementDto[]>(`${this.apiUrl}/Announcement`);
  }

  getActive(): Observable<AnnouncementDto[]> {
    return this.http.get<AnnouncementDto[]>(`${this.apiUrl}/Announcement/active`);
  }

  getById(id: number): Observable<AnnouncementDto> {
    return this.http.get<AnnouncementDto>(`${this.apiUrl}/Announcement/${id}`);
  }

  create(dto: CreateAnnouncementDto): Observable<AnnouncementDto> {
    return this.http.post<AnnouncementDto>(`${this.apiUrl}/Announcement`, dto);
  }

  update(id: number, dto: CreateAnnouncementDto): Observable<AnnouncementDto> {
    return this.http.put<AnnouncementDto>(`${this.apiUrl}/Announcement/${id}`, dto);
  }

  deactivate(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/Announcement/${id}/deactivate`, {});
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Announcement/${id}`);
  }
}
