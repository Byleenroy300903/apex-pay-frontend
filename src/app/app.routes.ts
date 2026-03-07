import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard';
import { VaultComponent } from './components/vault/vault';
import { LogsComponent } from './components/logs/logs';
import { AdminComponent } from './components/admin/admin';
import { authGuard } from './services/auth.guard';
import { LoginComponent } from './components/login/login';
import { TerminalBot } from './terminal-bot/terminal-bot';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'vault', component: VaultComponent },
  { path: 'logs', component: LogsComponent },
  { path: 'terminal_bot', component: TerminalBot },
  { path: 'login', component: LoginComponent },
  { path: 'admin', component: AdminComponent,canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];