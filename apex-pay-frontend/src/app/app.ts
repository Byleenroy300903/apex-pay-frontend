import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-root',
  standalone: true, // Ensure this is present
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterLink,       // Added this
    RouterLinkActive  // Added this
  ],
  template: `
    <div class="system-container">
      <nav class="terminal-navbar">
        <div class="nav-brand">APEX_PAY // OS</div>
        <div class="nav-links">
          <a routerLink="/" routerLinkActive="active-link" [routerLinkActiveOptions]="{exact: true}">
            [ 01_DASHBOARD ]
          </a>
          <a routerLink="/vault" routerLinkActive="active-link">
            [ 02_VAULT_MGMT ]
          </a>
          <a routerLink="/admin" routerLinkActive="active-link">
            [ 03_ADMIN_PANEL ]
          </a>
          <a routerLink="/logs" routerLinkActive="active-link">
            [ 04_SYSTEM_LOGS ]
          </a>
        </div>
      </nav>

      <main class="content-area">
        <router-outlet />
      </main>
    </div>
  `,
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('apex-pay-frontend');
}
