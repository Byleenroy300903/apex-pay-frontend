import { Component, signal, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';
import { PayrollService } from '../services/payroll';
import { LogService } from '../services/logs.service';

@Component({
  selector: 'app-terminal-bot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './terminal-bot.html',
  styleUrl: './terminal-bot.scss',
})
export class TerminalBot {
  private payroll = inject(PayrollService);
  private logs = inject(LogService);

  messages = signal<{role: 'system' | 'user' | 'bot', text: string}[]>([
    {role: 'system', text: 'APEXPAY_ORACLE_V1.0 initialized...'}
  ]);
  
  userInput = '';
  currentUser = signal<any>(null);
  isBooting = signal(false);

  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  ngOnInit() {
    this.addBotMessage("SYSTEM_READY. IDENTIFY VIA HEDERA_ID TO ACCESS SECURE LAYERS.");
  }

  handleInput() {
    const input = this.userInput.trim();
    if (!input) return;

    this.messages.update(m => [...m, {role: 'user', text: input}]);
    this.userInput = '';
    
    // Check for global commands like 'clear' before login logic
    if (input.toLowerCase() === 'clear') {
      this.messages.set([{role: 'system', text: 'TERMINAL_BUFFER_CLEARED.'}]);
      return;
    }

    this.processCommand(input.toLowerCase());
    this.scrollToBottom();
  }

  processCommand(cmd: string) {
    // --- 1. LOGIN PROTECTION ---
    if (!this.currentUser()) {
      this.attemptLogin(cmd);
      return;
    }

    // --- 2. LOGGED IN COMMANDS ---
    switch (true) {
      case cmd === 'help':
        this.addBotMessage(`AVAILABLE_COMMANDS:
        > profile      : View account details
        > payslip      : Generate PDF statement
        > status       : Check vault connectivity
        > logs         : Show recent session activity
        > logout       : Terminate secure session
        > clear        : Wipe terminal screen`);
        break;

      case cmd === 'profile':
        const u = this.currentUser();
        this.addBotMessage(`[IDENTITY_STRIP]
        NAME: ${u.fullName}
        ID: ${u.hederaAccountId}
        SALARY: ${u.baseSalaryUsd} USD
        REGION: ${u.taxCountry}
        AUTH: LEVEL_01_ADMIN`);
        break;

      case cmd === 'payslip' || cmd === 'download':
        this.generatePayslip();
        break;

      case cmd === 'status':
        this.addBotMessage("QUERYING_HEDERA_NETWORK...");
        this.payroll.getVaultStatus(this.currentUser().hederaAccountId, '0.0.7925123').subscribe({
          next: (res) => this.addBotMessage(`VAULT_ONLINE: Balance ${res.balanceHbar} HBAR. AI_CONSENSUS: VALID.`),
          error: () => this.addBotMessage("VAULT_OFFLINE: UNABLE_TO_REACH_SMART_CONTRACT.")
        });
        break;

      case cmd === 'logout':
        this.addBotMessage(`TERMINATING_SESSION_FOR_${this.currentUser().fullName}...`);
        setTimeout(() => {
          this.currentUser.set(null);
          this.addBotMessage("SESSION_CLOSED. IDENTIFY_YOURSELF.");
        }, 1000);
        break;

      case cmd === 'logs':
        this.addBotMessage("FETCHING_LOCAL_AUDIT_TRAIL...");
        const recentLogs = this.logs.logs().slice(0, 3).map(l => `[${l.status}] ${l.event}`).join('\n');
        this.addBotMessage(recentLogs || "NO_RECENT_ACTIVITY_DETECTED.");
        break;

      default:
        this.addBotMessage(`INVALID_COMMAND: "${cmd}". TYPE "help" FOR PROTOCOLS.`);
    }
  }

  private attemptLogin(id: string) {
    this.addBotMessage("SEARCHING_LEDGER...");
    this.payroll.getEmployees().subscribe(employees => {
      const found = employees.find(e => e.hederaAccountId === id || e.fullName.toLowerCase() === id);
      if (found) {
        this.currentUser.set(found);
        this.addBotMessage(`ACCESS_GRANTED. WELCOME, ${found.fullName}. SYSTEM_UNLOCKED.`);
        this.logs.addLog('SECURITY', `USER_AUTH: ${found.hederaAccountId}`, 'SUCCESS');
      } else {
        this.addBotMessage("ACCESS_DENIED: IDENTITY_NOT_RECOGNIZED_IN_APEX_VAULT.");
      }
    });
  }

  private addBotMessage(text: string) {
    this.messages.update(m => [...m, {role: 'bot', text}]);
    this.scrollToBottom();
  }

  generatePayslip() {
    const user = this.currentUser();
    const doc = new jsPDF();
    this.addBotMessage("ENCRYPTING_PDF... INJECTING_WATERMARK...");

    // PDF Styling - Dark Theme Look
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, 210, 297, 'F');
    doc.setTextColor(0, 255, 65);
    doc.setFont("courier", "bold");
    
    doc.text("------------------------------------------", 10, 20);
    doc.text("        APEXPAY // SECURE_STATEMENT       ", 10, 30);
    doc.text("------------------------------------------", 10, 40);
    doc.text(`DATE: ${new Date().toLocaleDateString()}`, 10, 60);
    doc.text(`HEDERA_ID: ${user.hederaAccountId}`, 10, 70);
    doc.text(`EMPLOYEE:  ${user.fullName}`, 10, 80);
    doc.text(`AMOUNT:    $${user.baseSalaryUsd}`, 10, 100);
    doc.text(`NETWORK:   HEDERA_TESTNET`, 10, 110);
    doc.text("------------------------------------------", 10, 130);
    doc.text("STATUS:    FUNDS_RELEASED_VIA_SMART_CONTRACT", 10, 140);

    doc.save(`AP_STMT_${user.fullName}.pdf`);
    this.addBotMessage("PAYSLIP_GEN_COMPLETE. CHECK_DOWNLOADS.");
  }

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.myScrollContainer) {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }
}