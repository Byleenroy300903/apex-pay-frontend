import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PayrollService } from '../../services/payroll';
import { Employee } from '../../models/employee';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule,DialogModule],
  templateUrl: './admin.html',
  styleUrl: './admin.scss'
})
export class AdminComponent implements OnInit {
  private payrollService = inject(PayrollService);
  deleteVisible = false;
selectedForDelete: any = null;

adminUser: string = 'SYS_ROOT_USER';
  today: Date = new Date();
  private clockSubscription?: Subscription;

  
  employees = signal<Employee[]>([]);
  
  // Model for the "Add New" form
  newEmployee: Partial<Employee> = {
    fullName: '',
    hederaAccountId: '',
    taxCountry: '',
    baseSalaryUsd: 0
  };

  ngOnInit() {
    this.loadEmployees();
    this.clockSubscription = interval(1000).subscribe(() => {
      this.today = new Date();
    });
  }

  loadEmployees() {
    this.payrollService.getEmployees().subscribe(data => this.employees.set(data));
  }

  onAdd() {
    if (!this.newEmployee.hederaAccountId?.startsWith('0.0.')) {
      alert("Invalid Hedera ID format");
      return;
    }
    this.payrollService.addEmployee(this.newEmployee).subscribe(() => {
      this.loadEmployees();
      this.resetForm();
    });
  }

  onDelete(id: number) {
    if (confirm('CRITICAL: Delete node from system? This cannot be undone.')) {
      this.payrollService.deleteEmployee(id).subscribe(() => this.loadEmployees());
    }
  }

  resetForm() {
    this.newEmployee = { fullName: '', hederaAccountId: '', taxCountry: '', baseSalaryUsd: 0 };
  }

  onUpdate(emp: Employee) {
  // Use +emp.id to ensure it is treated as a number
  this.payrollService.updateEmployee(+emp.id, emp).subscribe({
    next: () => {
      console.log(`Node ${emp.id} synchronized successfully.`);
    },
    error: (err) => console.error("Sync failed", err)
  });
}

confirmDelete(emp: any) {
  this.selectedForDelete = emp;
  this.deleteVisible = true;
}

executeDelete() {
  if (this.selectedForDelete) {
    this.payrollService.deleteEmployee(this.selectedForDelete.id).subscribe(() => {
      this.loadEmployees();
      this.deleteVisible = false;
    });
  }
}

ngOnDestroy() {
    // 3. Clean up the timer when leaving the admin page
    this.clockSubscription?.unsubscribe();
  }

}