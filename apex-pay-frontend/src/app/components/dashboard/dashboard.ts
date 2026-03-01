import { Component, OnInit, signal, inject,computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PayrollService } from '../../services/payroll';
import { Employee } from '../../models/employee';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { LogService } from '../../services/logs.service'; // Keep this import
import { interval, Subscription } from 'rxjs';
import { TimeAgoPipe } from '../../pipe/time-ago.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  // REMOVED LogService from here
  imports: [CommonModule, TableModule, ButtonModule, TimeAgoPipe], 
  templateUrl: './dashboard.html',
  styleUrl: 'dashboard.scss'
})
export class DashboardComponent implements OnInit {
  isLoading = signal(true); // Initialized to true for Page Load
  isActionPending = signal(false); // For specific button actions

  private timeTicker?: Subscription;

  private timeUpdateSubscription?: Subscription;
  selectedEmployeeHistory = signal<any[]>([]);
showHistoryModal = signal(false);


  showPopup = false;
  popupMessage = '';
  today: Date = new Date();
  
  // 1. Properly Inject the LogService
  private payrollService = inject(PayrollService);
  private logService = inject(LogService); 
  
  employees = signal<Employee[]>([]);
  //isLoading = signal(false);

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
  this.isLoading.set(true);
  this.payrollService.getEmployees().subscribe({
    next: (data) => {
      this.employees.set(data);
      this.isLoading.set(false);
      
      // NEW: After getting DB data, sync with the real Smart Contract state
      // Add a slight delay so the user actually sees the cool loader
        setTimeout(() => this.isLoading.set(false), 800);
      this.syncWithHederaLedger();
    },
    error: () => this.isLoading.set(false)
  });
}

displayEmployees = computed(() => {
    const uniqueMap = new Map<string, Employee>();
    
    this.employees().forEach(emp => {
      // We use hederaAccountId as the unique key. 
      // If the list has multiple entries for one ID, the last one wins.
      uniqueMap.set(emp.hederaAccountId, emp);
    });
    return Array.from(uniqueMap.values());
  });

syncWithHederaLedger() {
  const contractId = '0.0.7925123'; // Your Vault ID
  
  this.employees().forEach(emp => {
    // Call the status endpoint which hits 'getPaymentStatus' in Solidity
    this.payrollService.getVaultStatus(emp.hederaAccountId, contractId).subscribe({
      next: (hederaData) => {
        // If Hedera says they are approved, update our local UI state
        if (hederaData.isApprovedByAI) {
          this.updateLocalEmployeeStatus(emp.hederaAccountId, true);
        }
      }
    });
  });
}

private updateLocalEmployeeStatus(hederaId: string, status: boolean) {
  this.employees.update(current => 
    current.map(e => e.hederaAccountId === hederaId ? { ...e, isApprovedByAI: status } : e)
  );
}

private updateEmployeeStatusLocally(employeeId: string, approved: boolean) {
  this.employees.update(currentList => 
    currentList.map(emp => 
      emp.hederaAccountId === employeeId 
        ? { ...emp, isApprovedByAI: approved } 
        : emp
    )
  );
}

  onApprove(employeeId: string) {
    this.isActionPending.set(true);
    this.isLoading.set(true); // Trigger the overlay
  const contractId = '0.0.7925123';
  this.payrollService.approve(contractId, employeeId).subscribe({
    next: () => {
      // PUSH TO TERMINAL
      this.logService.addLog('PAYROLL', `AI_APPROVAL_GRANTED: ${employeeId}`, 'SUCCESS');
      
      // FIX: Manually update the signal so the [disabled] attribute unlocks the button
      this.updateEmployeeStatusLocally(employeeId, true);

      this.isLoading.set(false);
        this.isActionPending.set(false);
      
      this.triggerVintagePopup("AI_ORACLE_CONSENSUS_REACHED: VALIDATION_FINALIZED");
        this.logService.addLog('PAYROLL', `VALIDATED: ${employeeId}`, 'SUCCESS');
      
      // IMPORTANT: Don't call this.loadEmployees() here! 
      // If you do, it fetches the 'false' status from your DB and locks the button again.
    },
    error: (err) => {
      this.logService.addLog('PAYROLL', `AI_APPROVAL_FAILED: ${employeeId}`, 'FAIL');
    }
  });
}

triggerVintagePopup(msg: string) {
    this.popupMessage = msg;
    this.showPopup = true;
  }

  onWithdraw(employeeId: string) {
    this.isActionPending.set(true);
    this.isLoading.set(true);
  const contractId = '0.0.7925123';
  this.payrollService.withdraw(contractId, employeeId, 2.0).subscribe({
    next: () => {
      this.logService.addLog('PAYROLL', `FUNDS_RELEASED: ${employeeId} // 2.0 HBAR`, 'SUCCESS');
      
      // VINTAGE POPUP INSTEAD OF ALERT
      this.isLoading.set(false);
        this.isActionPending.set(false);
      this.triggerVintagePopup(`TRANSACTION_COMPLETE: 2.0 HBAR TRANSFERRED TO NODE ${employeeId}`);
      
      // Update local UI immediately
      this.loadEmployees(); 
    },
    error: () => {this.logService.addLog('PAYROLL', `RELEASE_FAILED: ${employeeId}`, 'FAIL');
                 this.isLoading.set(false);
        this.isActionPending.set(false);}
  });
}

// dashboard.component.ts

viewEmployeeDetails(emp: any) {
  this.logService.addLog('NETWORK', `RETRIEVING_LEDGER_HISTORY: ${emp.fullName}`, 'SUCCESS');

  // 1. CLEAR PREVIOUS TIMER (Prevents memory leaks and double-ticking)
  this.timeTicker?.unsubscribe();

  // 2. YOUR EXISTING API CALL
  this.payrollService.getHistoryById(emp.hederaAccountId).subscribe({
    next: (dbHistory: any[]) => {
      const logs = dbHistory.map(record => ({
        event: record.status?.includes('SUCCESS') ? 'FUNDS_RELEASED' : 'TX_FAILED',
        value: `${record.amountHbar || record.amount_hbar || 0} ℏ`,
        date: record.timestamp
      }));

      this.selectedEmployeeHistory.set([
        { event: 'VAULT_STATUS', value: 'SYNCING...' },
        ...logs
      ]);
      this.showHistoryModal.set(true);

      // 3. START THE LIVE TICKER 
      // This runs every second as long as the modal is open
      this.timeTicker = interval(1000).subscribe(() => {
        this.today = new Date(); // Updates the clock in the top-right
        
        // This 'spread' trick forces Angular to re-run the timeAgo pipe for every row
        this.selectedEmployeeHistory.update(current => [...current]);
      });

      // Background Vault Check
      this.payrollService.getVaultStatus(emp.hederaAccountId, '0.0.7925123').subscribe({
        next: (vaultStatus) => {
          this.selectedEmployeeHistory.update(current => [
            { event: 'VAULT_BALANCE', value: `${vaultStatus.balanceHbar} ℏ` },
            ...current.slice(1)
          ]);
        },
        error: () => {
          this.selectedEmployeeHistory.update(current => {
            const updated = [...current];
            updated[0] = { event: 'VAULT_STATUS', value: 'OFFLINE' };
            return updated;
          });
        }
      });
    }
  });
}


closeModal() {
    this.showHistoryModal.set(false);
    this.timeTicker?.unsubscribe();
  }

startTimeUpdates() {
  // Clear any existing timer first
  this.stopTimeUpdates();
  
  // Update the UI every 1000ms (1 second)
  this.timeUpdateSubscription = interval(1000).subscribe(() => {
    this.selectedEmployeeHistory.update(current => [...current]);
  });
}

stopTimeUpdates() {
  this.timeUpdateSubscription?.unsubscribe();
}
ngOnDestroy() {
  this.stopTimeUpdates();
}

}
