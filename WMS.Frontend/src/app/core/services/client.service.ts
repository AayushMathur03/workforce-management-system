import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ClientDto } from '../../models/wms.models';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAll(): Observable<ClientDto[]> {
    return this.http.get<ClientDto[]>(`${this.apiUrl}/Client`);
  }

  getById(id: number): Observable<ClientDto> {
    return this.http.get<ClientDto>(`${this.apiUrl}/Client/${id}`);
  }

  create(dto: ClientDto): Observable<ClientDto> {
    return this.http.post<ClientDto>(`${this.apiUrl}/Client`, dto);
  }

  update(id: number, dto: ClientDto): Observable<ClientDto> {
    return this.http.put<ClientDto>(`${this.apiUrl}/Client/${id}`, dto);
  }

  deactivate(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/Client/deactivate/${id}`, {});
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Client/${id}`);
  }
}
