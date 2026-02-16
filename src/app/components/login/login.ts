import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  error = signal<boolean>(false);
  isProcessing = signal<boolean>(false);

  async attemptLogin(pass: string) {
    if (!pass) return;

    this.isProcessing.set(true);
    this.error.set(false);

    // Simulate a "System Verification" delay
    setTimeout(() => {
      if (this.authService.login(pass)) {
        this.router.navigate(['/admin']);
      } else {
        this.error.set(true);
        this.isProcessing.set(false);
        // Reset error after 3 seconds
        setTimeout(() => this.error.set(false), 3000);
      }
    }, 1500);
  }
}