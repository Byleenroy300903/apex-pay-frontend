import { Component, OnInit, signal, inject, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PayrollService } from '../../services/payroll';
import { Employee } from '../../models/employee';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { LogService } from '../../services/logs.service';
import { interval, Subscription } from 'rxjs';
import { TimeAgoPipe } from '../../pipe/time-ago.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TimeAgoPipe],
  templateUrl: './dashboard.html',
  styleUrl: 'dashboard.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  // --- SIGNALS (State Management) ---
  isLoading = signal(true); 
  isActionPending = signal(false);
  employees = signal<Employee[]>([]);
  selectedEmployeeHistory = signal<any[]>([]);
  showHistoryModal = signal(false);

  // --- UI PROPERTIES ---
  showPopup = false;
  popupMessage = '';
  today: Date = new Date();

  // --- SUBSCRIPTIONS (Memory Management) ---
  private timeTicker?: Subscription;
  private timeUpdateSubscription?: Subscription;

  // --- INJECTIONS ---
  private payrollService = inject(PayrollService);
  private logService = inject(LogService);

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.isLoading.set(true);
    this.payrollService.getEmployees().subscribe({
      next: (data) => {
        this.employees.set(data);
        // Sync with Hedera in background
        this.syncWithHederaLedger();
        // Give the CRT loader a moment to shine
        setTimeout(() => this.isLoading.set(false), 800);
      },
      error: (err) => {
        console.error("CRITICAL_DB_FAILURE", err);
        this.logService.addLog('SYSTEM', 'DATABASE_OFFLINE', 'FAIL');
        this.isLoading.set(false); // RELEASE UI even on failure
      }
    });
  }

  // Prevents duplicate rows if the backend returns multiple entries per ID
  displayEmployees = computed(() => {
    const uniqueMap = new Map<string, Employee>();
    this.employees().forEach(emp => uniqueMap.set(emp.hederaAccountId, emp));
    return Array.from(uniqueMap.values());
  });

  syncWithHederaLedger() {
    const contractId = '0.0.7925123';
    this.employees().forEach(emp => {
      this.payrollService.getVaultStatus(emp.hederaAccountId, contractId).subscribe({
        next: (hederaData) => {
          if (hederaData && hederaData.isApprovedByAI) {
            this.updateLocalEmployeeStatus(emp.hederaAccountId, true);
          }
        },
        error: (err) => {
          // This stops the "Uncaught Ri" 500 error from crashing the whole Dashboard
          console.warn(`Vault Check Failed for ${emp.hederaAccountId}`);
          this.logService.addLog('ORACLE', `NODE_${emp.hederaAccountId}_SYNC_ERR`, 'FAIL');
          // Ensure we don't leave the global loader hanging
          this.isLoading.set(false);
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
        emp.hederaAccountId === employeeId ? { ...emp, isApprovedByAI: approved } : emp
      )
    );
  }

  onApprove(employeeId: string) {
    this.isActionPending.set(true);
    this.isLoading.set(true); // Trigger vintage overlay
    const contractId = '0.0.7925123';

    this.payrollService.approve(contractId, employeeId).subscribe({
      next: () => {
        this.logService.addLog('PAYROLL', `AI_APPROVAL_GRANTED: ${employeeId}`, 'SUCCESS');
        this.updateEmployeeStatusLocally(employeeId, true);
        this.isLoading.set(false);
        this.isActionPending.set(false);
        this.triggerVintagePopup("AI_ORACLE_CONSENSUS: VALIDATION_FINALIZED");
      },
      error: (err) => {
        console.error("APPROVE_FAILED", err);
        this.logService.addLog('PAYROLL', `VALIDATION_FAILED: ${employeeId}`, 'FAIL');
        this.isLoading.set(false);
        this.isActionPending.set(false);
      }
    });
  }

  onWithdraw(employeeId: string) {
    this.isActionPending.set(true);
    this.isLoading.set(true);
    const contractId = '0.0.7925123';

    this.payrollService.withdraw(contractId, employeeId, 2.0).subscribe({
      next: () => {
        this.logService.addLog('PAYROLL', `FUNDS_RELEASED: ${employeeId}`, 'SUCCESS');
        this.isLoading.set(false);
        this.isActionPending.set(false);
        this.triggerVintagePopup(`TX_COMPLETE: 2.0 HBAR TRANSFERRED`);
        this.loadEmployees(); // Reload list to update balances
      },
      error: (err) => {
        console.error("WITHDRAW_FAILED", err);
        this.logService.addLog('PAYROLL', `RELEASE_DENIED: ${employeeId}`, 'FAIL');
        this.isLoading.set(false);
        this.isActionPending.set(false);
      }
    });
  }

  viewEmployeeDetails(emp: any) {
    this.logService.addLog('NETWORK', `RETRIEVING_HISTORY: ${emp.fullName}`, 'SUCCESS');
    this.timeTicker?.unsubscribe();

    this.payrollService.getHistoryById(emp.hederaAccountId).subscribe({
      next: (dbHistory: any[]) => {
        const logs = dbHistory.map(record => ({
          event: record.status?.includes('SUCCESS') ? 'FUNDS_RELEASED' : 'TX_FAILED',
          value: `${record.amountHbar || 0} ℏ`,
          date: record.timestamp
        }));

        this.selectedEmployeeHistory.set([{ event: 'VAULT_STATUS', value: 'SYNCING...' }, ...logs]);
        this.showHistoryModal.set(true);

        // Start real-time clock for the modal
        this.timeTicker = interval(1000).subscribe(() => {
          this.today = new Date();
          this.selectedEmployeeHistory.update(current => [...current]);
        });

        // Background Vault Status check
        this.payrollService.getVaultStatus(emp.hederaAccountId, '0.0.7925123').subscribe({
          next: (vStatus) => {
            this.selectedEmployeeHistory.update(current => [
              { event: 'VAULT_BALANCE', value: `${vStatus.balanceHbar} ℏ` },
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
      },
      error: () => this.logService.addLog('NETWORK', 'HISTORY_FETCH_FAILED', 'FAIL')
    });
  }

  triggerVintagePopup(msg: string) {
    this.popupMessage = msg;
    this.showPopup = true;
  }

  closeModal() {
    this.showHistoryModal.set(false);
    this.timeTicker?.unsubscribe();
    this.stopTimeUpdates();
  }

  startTimeUpdates() {
    this.stopTimeUpdates();
    this.timeUpdateSubscription = interval(1000).subscribe(() => {
      this.selectedEmployeeHistory.update(current => [...current]);
    });
  }

  stopTimeUpdates() {
    this.timeUpdateSubscription?.unsubscribe();
  }

  ngOnDestroy() {
    this.timeTicker?.unsubscribe();
    this.timeUpdateSubscription?.unsubscribe();
    this.stopTimeUpdates();
  }
}
