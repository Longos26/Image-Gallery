import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { UserService } from './user.service';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost/imgGalleryApi/'; // Adjust the URL as needed
  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());

  constructor(private http: HttpClient, private userService: UserService) {}

  get isLoggedIn(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }

  get isLoggedInSync(): boolean {
    return this.loggedIn.value;
  }

  register(username: string, password: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.apiUrl}register`, { username, password }, { headers })
      .pipe(
        catchError(error => {
          console.error('Registration error:', error);
          return throwError(error.error || 'Server error');
        })
      );
  }

  login(username: string, password: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.apiUrl}login`, { username, password }, { headers })
      .pipe(
        catchError(error => {
          console.error('Login error:', error);
          return throwError(error.error || 'Server error');
        })
      );
  }

  handleLoginResponse(response: any): void {
    if (response && response.username) {
      localStorage.setItem('username', response.username);
      this.loggedIn.next(true);
      this.userService.setUsername(response.username);
    }
  }

  logout(): void {
    localStorage.removeItem('username');
    this.loggedIn.next(false);
    this.userService.setUsername(null);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('username');
  }
}
