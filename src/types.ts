export interface InstallmentRecord {
  index: number;
  paymentDate: string; // e.g. "1404/10/15 14:01:57"
  amountRial: number;
  amountToman: number;
  penaltyAmountRial?: number;
  penaltyAmountToman?: number;
  paidAmountRial?: number;
  paidAmountToman?: number;
  trackingNumber?: string;
  status: 'PAID' | 'SETTLED';
}

export interface SettledCase {
  caseId: string; // ID (e.g. "4911")
  caseNumber?: string; // شماره پرونده (e.g. "104873")
  customerName: string; // نام کاربر
  shopName?: string; // نام فروشگاه (e.g. "پارک وی")
  sponsor?: string; // اسپانسر (e.g. "اسپانسر بقولی فرد")
  settlementDateTime?: string; // e.g. "1405-07-07 07:59:22"
  contractNumber: string;
  nationalId: string;
  phone: string;
  settlementDate: string; // Jalali date
  installmentCount: number;
  installmentAmountRial: number;
  installmentAmountToman: number; // Rial / 10
  totalSettledRial: number;
  totalSettledToman: number;
  loanTitle?: string;
  sourceUrl?: string;
  installments: InstallmentRecord[];
  processingStatus: 'PROCESSED' | 'PENDING' | 'FAILED';
  processedAt: string | null;
  imageFilename: string | null;
  imagePath: string | null;
  discrepancyNote: string | null;
}

export interface Transaction {
  transactionId: string;
  caseId: string;
  customerName: string;
  nationalId?: string;
  phone?: string;
  paymentDate: string;
  time: string;
  amountRial: number;
  amountToman: number;
  gateway: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  reconciliationStatus: 'MATCHED' | 'DISCREPANCY' | 'UNLINKED';
  reconciliationNote?: string;
}

export interface DailyExecutionReport {
  id: string;
  runDate: string; // Jalali date e.g. "1405-01-25"
  startTime: string;
  endTime: string;
  totalCasesScanned: number;
  newCasesFound: number;
  imagesGenerated: number;
  errorsCount: number;
  zipFilename: string | null;
  zipDownloadUrl: string | null;
  status: 'SUCCESS' | 'PARTIAL' | 'ERROR';
  logs: string[];
}

export interface AutomationConfig {
  adminUrl: string;
  scheduleTime: string;
  timezone: string;
  isHeadless: boolean;
  hasCredentials: boolean;
  usernameConfigured: boolean;
  lastRunTimestamp: string | null;
}
