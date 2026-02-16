export interface Employee {
  id: string;
  fullName: string;
  hederaAccountId: string; // The 0.0.xxxx address
  complianceStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  isApprovedByAI: boolean;
  vaultBalance: number;
  taxCountry: string;
  baseSalaryUsd: number;
}