import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { UserService } from '../user.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isLoggedIn: boolean = false;
  username: string | null = null;

  constructor(
    private authService: AuthService, 
    private userService: UserService, 
    private router: Router
  ) {}

  ngOnInit() {
    // Subscribe to the authentication status
    this.authService.isLoggedIn.subscribe(status => this.isLoggedIn = status);
    
    // Subscribe to the current username
    this.userService.currentUsername.subscribe(name => this.username = name);
  }

  logout() {
    // Call the logout method from AuthService
    this.authService.logout();
    
    // Redirect to homepage after logout
    this.router.navigate(['/']);
  }

  navigateBasedOnLogin() {
    // Navigate to gallery if logged in, otherwise navigate to homepage
    if (this.isLoggedIn) {
      this.router.navigate(['/gallery']);
    } else {
      this.router.navigate(['/']);
    }
  }
}
