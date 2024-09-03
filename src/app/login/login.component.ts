import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    this.authService.login(this.username, this.password).subscribe({
      next: response => {
        if (response.message) {
          this.authService.handleLoginResponse(response);
          this.router.navigate(['/gallery']);
        } else {
          console.error('No account found');
          alert('No account found');
        }
      },
      error: err => {
        console.error('Login failed:', err.error?.message || err);
        alert('Login failed: ' + (err.error?.message || 'Unknown error'));
      }
    });
  }
}
