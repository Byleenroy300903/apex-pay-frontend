import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee } from '../models/employee';
import { TransactionRecord } from '../models/history';

@Injectable({
  providedIn: 'root'
})


export class PayrollService {
  private apiUrl = 'https://backend-whrl.onrender.com/api/employees/api/employees';
  private http = inject(HttpClient);

  // 1. Get all employees (Matches @GetMapping)
  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.apiUrl);
  }

  // 2. Deploy a new Vault (Matches @PostMapping("/vault/deploy") with @RequestBody)
  deployVault(aiOracleId: string): Observable<string> {
    // Sending as a JSON body to match your backend's Map<String, String> request
    return this.http.post(`${this.apiUrl}/vault/deploy`, 
      { aiOracleId: aiOracleId }, 
      { responseType: 'text' }
    );
  }

  // 3. Deposit HBAR (Matches @PostMapping("/vault/deposit") with @RequestParam)
  deposit(contractId: string, employeeId: string, amount: number): Observable<string> {
    const params = new HttpParams()
      .set('contractId', contractId)
      .set('employeeId', employeeId)
      .set('amount', amount.toString());
    
    return this.http.post(`${this.apiUrl}/vault/deposit`, null, { params, responseType: 'text' });
  }

  // 4. Approve via AI Oracle (Matches @PostMapping("/vault/approve") with @RequestParam)
  approve(contractId: string, employeeId: string): Observable<string> {
    const params = new HttpParams()
      .set('contractId', contractId)
      .set('employeeId', employeeId);
    
    return this.http.post(`${this.apiUrl}/vault/approve`, null, { params, responseType: 'text' });
  }

  // 5. Final Withdrawal (Matches @PostMapping("/vault/withdraw") with @RequestParam)
  withdraw(contractId: string, employeeId: string, amount: number): Observable<string> {
    const params = new HttpParams()
      .set('contractId', contractId)
      .set('employeeId', employeeId)
      .set('amount', amount.toString());

    return this.http.post(`${this.apiUrl}/vault/withdraw`, null, { params, responseType: 'text' });
  }

  // 6. Get Vault Status (Matches @GetMapping("/vault/status/{employeeId}"))
  getVaultStatus(employeeId: string, contractId: string): Observable<any> {
    const params = new HttpParams().set('contractId', contractId);
    // Returning as any/JSON because your backend returns a Map<String, Object>
    return this.http.get(`${this.apiUrl}/vault/status/${employeeId}`, { params });
  }

  // Inside the PayrollService class
getHistoryByName(fullName: string): Observable<TransactionRecord[]> {
  return this.http.get<TransactionRecord[]>(`${this.apiUrl}/transactions/${fullName}`);
}

// payroll.service.ts
getHistoryById(id: string): Observable<TransactionRecord[]> {
  // Make sure this path matches your @GetMapping in Java
  return this.http.get<TransactionRecord[]>(`${this.apiUrl}/transactions/${id}`);
}

updateEmployee(id: number, employee: Employee): Observable<Employee> {
  return this.http.put<Employee>(`${this.apiUrl}/${id}`, employee);
}

deleteEmployee(id: number): Observable<any> {
  return this.http.delete(`${this.apiUrl}/${id}`);
}

addEmployee(employee: Partial<Employee>): Observable<Employee> {
  return this.http.post<Employee>(this.apiUrl, employee);
}

}