import fs from 'fs';
import { SettledCase, Transaction, DailyExecutionReport } from '../automation/types';
import { STORAGE_PATHS } from './storageSetup';
import { INITIAL_CASES, INITIAL_TRANSACTIONS, INITIAL_REPORTS } from './initialData';
import { saveCardImage } from '../image-generator/cardGenerator';

interface DatabaseSchema {
  cases: SettledCase[];
  transactions: Transaction[];
  reports: DailyExecutionReport[];
  lastSync: string | null;
}

class DatabaseManager {
  private data: DatabaseSchema;
  private filePath: string;

  constructor() {
    this.filePath = STORAGE_PATHS.dbFile;
    this.data = this.load();
    this.ensureImagesForProcessedCases();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (e) {
      console.error('Error loading database file, initializing default:', e);
    }

    const defaultData: DatabaseSchema = {
      cases: INITIAL_CASES,
      transactions: INITIAL_TRANSACTIONS,
      reports: INITIAL_REPORTS,
      lastSync: new Date().toISOString()
    };
    this.save(defaultData);
    return defaultData;
  }

  private save(data: DatabaseSchema): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving database file:', e);
    }
  }

  // Pre-generate image cards on disk for pre-existing processed cases
  private async ensureImagesForProcessedCases() {
    for (const c of this.data.cases) {
      if (c.processingStatus === 'PROCESSED') {
        try {
          const res = await saveCardImage(c);
          c.imageFilename = res.filename;
          c.imagePath = `/storage/reports/${res.filename}`;
        } catch (e) {
          console.error(`Failed to pre-generate image for case ${c.caseId}`, e);
        }
      }
    }
  }

  public getCases(): SettledCase[] {
    return this.data.cases;
  }

  public getCaseById(caseId: string): SettledCase | undefined {
    return this.data.cases.find(c => c.caseId === caseId);
  }

  public upsertCase(c: SettledCase): void {
    const idx = this.data.cases.findIndex(item => item.caseId === c.caseId);
    if (idx >= 0) {
      this.data.cases[idx] = c;
    } else {
      this.data.cases.push(c);
    }
    this.save(this.data);
  }

  public updateCaseStatus(caseId: string, status: 'PROCESSED' | 'PENDING' | 'FAILED', imageFilename?: string, imagePath?: string): void {
    const c = this.getCaseById(caseId);
    if (c) {
      c.processingStatus = status;
      if (status === 'PROCESSED') {
        c.processedAt = new Date().toLocaleString('fa-IR');
        if (imageFilename) c.imageFilename = imageFilename;
        if (imagePath) c.imagePath = imagePath;
      }
      this.save(this.data);
    }
  }

  public getTransactions(): Transaction[] {
    return this.data.transactions;
  }

  public upsertTransaction(tx: Transaction): void {
    const idx = this.data.transactions.findIndex(item => item.transactionId === tx.transactionId);
    if (idx >= 0) {
      this.data.transactions[idx] = tx;
    } else {
      this.data.transactions.push(tx);
    }
    this.save(this.data);
  }

  public getReports(): DailyExecutionReport[] {
    return this.data.reports;
  }

  public addReport(rep: DailyExecutionReport): void {
    this.data.reports.unshift(rep);
    this.data.lastSync = new Date().toISOString();
    this.save(this.data);
  }

  public getLastSync(): string | null {
    return this.data.lastSync;
  }
}

export const db = new DatabaseManager();
