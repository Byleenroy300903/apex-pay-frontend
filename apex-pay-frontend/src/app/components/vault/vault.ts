import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-vault',
  standalone: true,
  imports: [CommonModule, ProgressBarModule, ButtonModule, FormsModule],
  templateUrl: './vault.html',
  styleUrl: './vault.scss'
})
export class VaultComponent implements OnInit {
  // 1. State Management
  isLocked = signal(true);
  pinInput = signal('');
  vaultBalance = signal(1240.50);
  utilization = signal(36);
  isAuditing = signal(false);

  // 2. The Missing Lifecycle Hook
  ngOnInit(): void {
    console.log("VAULT_MODULE: INITIALIZING_SECURITY_PROTOCOLS...");
    this.calculateUtilization();
  }

  // 3. Logic Methods
  verifyAccess() {
    if (this.pinInput() === '1234') {
      this.isLocked.set(false);
    } else {
      alert('ACCESS_DENIED: SECURE_PIN_INVALID');
      this.pinInput.set('');
    }
  }

  calculateUtilization() {
    const reserved = 450; 
    const total = this.vaultBalance();
    this.utilization.set(Math.round((reserved / total) * 100));
  }

  runAudit() {
    this.isAuditing.set(true);
    setTimeout(() => {
      this.isAuditing.set(false);
      this.vaultBalance.update(v => v + 12.50);
      this.calculateUtilization();
    }, 2000);
  }
}