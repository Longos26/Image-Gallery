import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  username: string = '';
  password: string = '';
  confirmPassword: string = '';
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  onRegister() {
    if (!this.confirmPassword) {
      this.errorMessage = 'Confirm Password is required';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    this.authService.register(this.username, this.password).subscribe({
      next: response => {
        if (response.message) {
          console.log(response.message);
          console.log('Unique ID:', response.unique_id);
          this.router.navigate(['/login']);
        }
      },
      error: err => {
        if (err.error && err.error.error === 'Username already exists.') {
          this.errorMessage = 'Username already in use.';
        } else {
          this.errorMessage = 'Registration failed. Please try using a different username.';
        }
      }
    });
  }
}
