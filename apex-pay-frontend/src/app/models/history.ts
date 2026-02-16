export interface TransactionRecord {
  id?: number;
  employeeName: string;
  amountHbar: number;
  status: string;
  timestamp: string;
  hederaTransactionId: string;
}