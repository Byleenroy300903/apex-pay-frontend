import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // The master key (Fixed Password)
  private readonly MASTER_KEY = 'APEX_SECURE_2026'; 
  
  // Reactive login state
  isAuthenticated = signal<boolean>(false);

  login(password: string): boolean {
    if (password === this.MASTER_KEY) {
      this.isAuthenticated.set(true);
      return true;
    }
    return false;
  }

  logout() {
    this.isAuthenticated.set(false);
  }
}