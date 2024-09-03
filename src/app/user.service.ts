import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost/imgGalleryApi/'; // Adjust the URL as needed
  private usernameSource = new BehaviorSubject<string | null>(localStorage.getItem('username'));
  private uniqueIDSource = new BehaviorSubject<string | null>(localStorage.getItem('unique_id'));

  currentUsername = this.usernameSource.asObservable();
  currentUniqueID = this.uniqueIDSource.asObservable();

  constructor(private http: HttpClient) {}

  setUsername(username: string | null) {
    this.usernameSource.next(username);
    if (username) {
      this.fetchUniqueID(username);
    }
  }

  setUniqueID(unique_id: string | null) {
    this.uniqueIDSource.next(unique_id);
  }

  private fetchUniqueID(username: string) {
    this.http.get<any>(`${this.apiUrl}get_unique_id/${username}`)
      .subscribe(response => {
        if (response.unique_ID) {
          localStorage.setItem('unique_id', response.unique_ID);
          this.setUniqueID(response.unique_ID);
        }
      }, error => {
        console.error('Failed to fetch unique ID:', error);
      });
  }

  getImagesByUniqueId(): Observable<any> {
    const unique_id = localStorage.getItem('unique_id');
    if (unique_id) {
      return this.http.get<any>(`${this.apiUrl}get-images-by-id/${unique_id}`)
        .pipe(catchError(this.handleError));
    } else {
      return throwError('Unique ID is not set.');
    }
  }

  uploadImageWithId(imageData: FormData): Observable<any> {
    const unique_id = localStorage.getItem('unique_id');
    if (unique_id) {
      imageData.append('unique_id', unique_id);
      return this.http.post<any>(`${this.apiUrl}upload-image-with-id`, imageData)
        .pipe(catchError(this.handleError));
    } else {
      return throwError('Unique ID is not set.');
    }
  }

  deleteImage(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}delete-image`, { body: { id } })
      .pipe(catchError(this.handleError));
  }

  downloadImage(imageId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}download-image/${imageId}`, { responseType: 'blob' })
      .pipe(catchError(this.handleError));
  }
  
  private handleError(error: any): Observable<never> {
    console.error('An error occurred:', error);
    return throwError(error.message || 'Server error');
  }
}