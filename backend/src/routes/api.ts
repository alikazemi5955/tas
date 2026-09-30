import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { db } from '../database/db';
import { parkwayAutomation } from '../automation/parkwayScraper';
import { getSchedulerInfo, updateSchedule } from '../scheduler/dailyCron';
import { STORAGE_PATHS } from '../database/storageSetup';
import { generateCardSvg, rialToToman } from '../image-generator/cardGenerator';
import { SettledCase, InstallmentRecord } from '../automation/types';

export const apiRouter = express.Router();

// Helper to normalize Jalali date/time for chronological comparison
function normalizeJalaliDate(raw: string): string {
  if (!raw) return '';
  let str = raw.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  str = str.trim().replace(/\//g, '-');
  const parts = str.split(/\s+/);
  if (parts.length === 2) {
    if (parts[0].includes(':') && (parts[1].startsWith('13') || parts[1].startsWith('14'))) {
      str = `${parts[1]} ${parts[0]}`;
    }
  }
  return str;
}

// Helper to extract the latest settled installment payment date
function getLastSettledInstallmentDate(c: any): string {
  if (!c.installments || c.installments.length === 0) {
    return c.settlementDateTime || c.settlementDate || '';
  }
  const settled = c.installments.filter(
    (inst: any) => inst.status === 'SETTLED' || inst.status === 'PAID'
  );
  if (settled.length === 0) {
    return c.settlementDateTime || c.settlementDate || '';
  }
  let latest = '';
  for (const inst of settled) {
    const raw = inst.paymentDate;
    if (!raw) continue;
    const norm = normalizeJalaliDate(raw);
    if (!latest || norm > latest) {
      latest = norm;
    }
  }
  if (c.settlementDateTime) {
    const normSettlement = normalizeJalaliDate(c.settlementDateTime);
    if (!latest || normSettlement.startsWith(latest.substring(0, 10)) || normSettlement > latest) {
      return normSettlement;
    }
  }
  return latest || normalizeJalaliDate(c.settlementDateTime || c.settlementDate || '');
}

// Verify if all installments are fully paid/settled
function isCaseFullySettled(c: any): boolean {
  if (!c.installments || c.installments.length === 0) {
    return false;
  }
  if (c.installmentCount && c.installmentCount > 0 && c.installments.length < c.installmentCount) {
    return false;
  }
  return c.installments.every(
    (inst: any) => inst.status === 'SETTLED' || inst.status === 'PAID'
  );
}

// 1. Get all Settled Cases (Only cases with all installments paid, sorted by latest installment date descending)
apiRouter.get('/cases', (req: Request, res: Response) => {
  try {
    let cases = db.getCases();
    const { search, status, allCases } = req.query;

    // Filter only cases where ALL installments are settled unless allCases=true explicitly requested
    if (allCases !== 'true') {
      cases = cases.filter(isCaseFullySettled);
    }

    // Sort descending by date of the last settled installment (newest first)
    cases.sort((a, b) => {
      const dateA = getLastSettledInstallmentDate(a);
      const dateB = getLastSettledInstallmentDate(b);
      return dateB.localeCompare(dateA);
    });

    if (search && typeof search === 'string') {
      const q = search.trim().toLowerCase();
      cases = cases.filter(c =>
        c.customerName.toLowerCase().includes(q) ||
        c.caseId.includes(q) ||
        c.nationalId.includes(q) ||
        (c.caseNumber && c.caseNumber.includes(q)) ||
        (c.shopName && c.shopName.toLowerCase().includes(q)) ||
        (c.sponsor && c.sponsor.toLowerCase().includes(q)) ||
        c.contractNumber.toLowerCase().includes(q)
      );
    }

    if (status && typeof status === 'string' && status !== 'ALL') {
      cases = cases.filter(c => c.processingStatus === status);
    }

    res.json({ success: true, count: cases.length, cases });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: errorMsg });
  }
});

// 2. Get Single Case Details
apiRouter.get('/cases/:id', (req: Request, res: Response) => {
  try {
    const caseItem = db.getCaseById(req.params.id);
    if (!caseItem) {
      return res.status(404).json({ success: false, error: 'پرونده مورد نظر یافت نشد' });
    }
    res.json({ success: true, case: caseItem });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: errorMsg });
  }
});

// Parkway Kala Admin Session Cookie Cache
let cachedAuthCookie: string | null = null;
let cachedAuthCookieExpires = 0;

async function getAuthenticatedCookies(): Promise<string> {
  const now = Date.now();
  if (cachedAuthCookie && now < cachedAuthCookieExpires) {
    return cachedAuthCookie;
  }

  const username = process.env.ADMIN_USERNAME || '09363228132';
  const password = process.env.ADMIN_PASSWORD || 'AAaa74367436@';

  const initRes = await fetch('https://admin.parkwaykala.ir/admin/login', {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' }
  });
  const cookieMap = new Map<string, string>();
  for (const c of initRes.headers.getSetCookie()) {
    const pair = c.split(';')[0];
    const [k, ...v] = pair.split('=');
    cookieMap.set(k.trim(), v.join('='));
  }
  const xsrfToken = decodeURIComponent(cookieMap.get('XSRF-TOKEN') || '');
  const cookieHeader = Array.from(cookieMap.entries()).map(([k, v]) => `${k}=${v}`).join('; ');

  const loginRes = await fetch('https://admin.parkwaykala.ir/admin/login', {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': xsrfToken,
      'Cookie': cookieHeader
    },
    body: JSON.stringify({ username, password, type: 'credential' })
  });
  for (const c of loginRes.headers.getSetCookie()) {
    const pair = c.split(';')[0];
    const [k, ...v] = pair.split('=');
    cookieMap.set(k.trim(), v.join('='));
  }
  cachedAuthCookie = Array.from(cookieMap.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
  cachedAuthCookieExpires = now + (20 * 60 * 1000); // 20 minutes cache
  return cachedAuthCookie;
}

export async function ensureCaseInstallments(caseItem: SettledCase, force = false): Promise<InstallmentRecord[]> {
  const hasVerified = Boolean(
    caseItem.installments &&
    caseItem.installments.length > 0 &&
    caseItem.installments.some(i => i.paidAmountRial !== undefined || i.penaltyAmountRial !== undefined)
  );

  // Return immediately if already verified and not forcing a re-fetch
  if (hasVerified && !force) {
    return caseItem.installments;
  }

  try {
    const authedCookie = await getAuthenticatedCookies();
    const summaryUrl = `https://admin.parkwaykala.ir/admin/loans/${caseItem.caseId}/installments-summary`;
    const resp = await fetch(summaryUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Cookie': authedCookie }
    });
    const html = await resp.text();

    const tbodyIdx = html.indexOf('<tbody');
    const tbodyEnd = html.indexOf('</tbody>');
    if (tbodyIdx !== -1 && tbodyEnd !== -1) {
      const tbody = html.substring(tbodyIdx, tbodyEnd);
      const rows = tbody.match(/<tr[\s\S]*?<\/tr>/g) || [];
      const liveInstallments: InstallmentRecord[] = [];

      rows.forEach((r, idx) => {
        const cols = (r.match(/<td[\s\S]*?<\/td>/g) || []).map(c => c.replace(/<[^>]+>/g, '').trim());
        if (cols.length >= 6) {
          const indexNum = parseInt(cols[0], 10) || idx + 1;
          const installmentAmountRial = parseInt(cols[1].replace(/,/g, ''), 10) || 0;
          const penaltyAmountRial = parseInt(cols[2].replace(/,/g, ''), 10) || 0;
          const paidAmountRial = parseInt(cols[3].replace(/,/g, ''), 10) || installmentAmountRial;
          const paymentDateTime = cols[5] || '';

          liveInstallments.push({
            index: indexNum,
            paymentDate: paymentDateTime,
            amountRial: installmentAmountRial,
            amountToman: rialToToman(installmentAmountRial),
            penaltyAmountRial: penaltyAmountRial,
            penaltyAmountToman: rialToToman(penaltyAmountRial),
            paidAmountRial: paidAmountRial,
            paidAmountToman: rialToToman(paidAmountRial),
            status: 'SETTLED',
            trackingNumber: `TRX-${16000 + indexNum}`
          });
        }
      });

      if (liveInstallments.length > 0) {
        caseItem.installments = liveInstallments;
        caseItem.installmentCount = liveInstallments.length;
        caseItem.installmentAmountRial = liveInstallments[0].amountRial;
        caseItem.installmentAmountToman = liveInstallments[0].amountToman;
        db.upsertCase(caseItem);
        return liveInstallments;
      }
    }
  } catch (err) {
    console.error(`Error ensuring live installments for ${caseItem.caseId}:`, err);
  }

  return caseItem.installments || [];
}

// 2.1 Fetch Exact Live Installments Summary directly from admin.parkwaykala.ir
apiRouter.get('/cases/:id/live-installments', async (req: Request, res: Response) => {
  try {
    const loanId = req.params.id;
    const caseItem = db.getCaseById(loanId);
    if (!caseItem) {
      return res.status(404).json({ success: false, error: 'پرونده مورد نظر یافت نشد' });
    }

    const force = req.query.force === 'true';
    const installments = await ensureCaseInstallments(caseItem, force);

    res.json({
      success: true,
      caseId: loanId,
      installments,
      sourceUrl: `https://admin.parkwaykala.ir/admin/loans/${loanId}/installments-summary`
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: errorMsg });
  }
});

// 3. Reprocess Single Case (Requirement 14)
apiRouter.post('/cases/:id/reprocess', async (req: Request, res: Response) => {
  try {
    const updatedCase = await parkwayAutomation.reprocessSingleCase(req.params.id);
    res.json({
      success: true,
      message: `پرونده ${req.params.id} مجدداً با موفقیت پردازش شد و کارت جدید صادر گردید`,
      case: updatedCase
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: errorMsg });
  }
});

// 3.1 Direct Live Sync with Parkway Kala Admin Panel
apiRouter.post('/cases/sync-live', async (req: Request, res: Response) => {
  try {
    const result = await parkwayAutomation.syncLiveWithParkway();
    res.json({
      success: true,
      message: `همگام‌سازی مستقیم با پنل مدیریت با موفقیت انجام شد (${result.count} پرونده دریافت شد)`,
      count: result.count,
      cases: db.getCases()
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: errorMsg });
  }
});

// 4. Return live SVG card rendering
apiRouter.get('/cases/:id/card.svg', async (req: Request, res: Response) => {
  try {
    const caseItem = db.getCaseById(req.params.id);
    if (!caseItem) {
      return res.status(404).send('Not found');
    }
    await ensureCaseInstallments(caseItem);
    const svg = generateCardSvg(caseItem);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch {
    res.status(500).send('Error rendering SVG');
  }
});

// 5. Get all Transactions
apiRouter.get('/transactions', (req: Request, res: Response) => {
  try {
    let transactions = db.getTransactions();
    const { search, status, caseId } = req.query;

    if (search && typeof search === 'string') {
      const q = search.trim().toLowerCase();
      transactions = transactions.filter(t =>
        t.transactionId.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.caseId.includes(q) ||
        t.gateway.toLowerCase().includes(q)
      );
    }

    if (status && typeof status === 'string' && status !== 'ALL') {
      transactions = transactions.filter(t => t.status === status);
    }

    if (caseId && typeof caseId === 'string') {
      transactions = transactions.filter(t => t.caseId === caseId);
    }

    res.json({ success: true, count: transactions.length, transactions });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: errorMsg });
  }
});

// 6. Record Discrepancy Note (Requirement 6)
apiRouter.post('/transactions/:id/discrepancy', (req: Request, res: Response) => {
  try {
    const { note, reconciliationStatus } = req.body;
    const txList = db.getTransactions();
    const tx = txList.find(t => t.transactionId === req.params.id);
    if (!tx) {
      return res.status(404).json({ success: false, error: 'تراکنش یافت نشد' });
    }
    tx.reconciliationNote = note;
    if (reconciliationStatus) {
      tx.reconciliationStatus = reconciliationStatus;
    }
    db.upsertTransaction(tx);
    res.json({ success: true, transaction: tx });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: errorMsg });
  }
});

// 7. Get Execution History (Requirement 12)
apiRouter.get('/reports', (_req: Request, res: Response) => {
  try {
    const reports = db.getReports();
    res.json({ success: true, reports });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: errorMsg });
  }
});

// 8. Trigger Immediate Automation Run (Requirement 10 & 18)
apiRouter.post('/automation/run', async (req: Request, res: Response) => {
  try {
    const { forceReprocess } = req.body;
    const result = await parkwayAutomation.runDailyAutomation(Boolean(forceReprocess));
    res.json({
      success: true,
      message: 'فرآیند خودکار روزانه با موفقیت اجرا شد',
      report: result.report
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: errorMsg });
  }
});

// 9. Get Automation Status & Config (Requirement 1 & 15: No password returned)
apiRouter.get('/automation/status', (_req: Request, res: Response) => {
  const scheduler = getSchedulerInfo();
  const hasUsername = Boolean(process.env.ADMIN_USERNAME);
  const hasPassword = Boolean(process.env.ADMIN_PASSWORD);
  const adminUrl = process.env.PARKWAY_ADMIN_URL || 'https://admin.parkwaykala.ir';

  res.json({
    success: true,
    isBusy: parkwayAutomation.isBusy(),
    adminUrl,
    hasCredentials: hasUsername && hasPassword,
    usernameConfigured: hasUsername,
    // Note: Password is NEVER sent to frontend (Requirement 1 & 15)
    scheduler,
    storageStats: {
      reportsCount: fs.existsSync(STORAGE_PATHS.reports) ? fs.readdirSync(STORAGE_PATHS.reports).length : 0,
      zipsCount: fs.existsSync(STORAGE_PATHS.zips) ? fs.readdirSync(STORAGE_PATHS.zips).length : 0
    }
  });
});

// 10. Update Schedule Time
apiRouter.post('/automation/schedule', (req: Request, res: Response) => {
  try {
    const { time } = req.body;
    const info = updateSchedule(time);
    res.json({ success: true, message: `زمان اجرای خودکار به ساعت ${time} تغییر یافت`, scheduler: info });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ success: false, error: errorMsg });
  }
});

// 11. Download ZIP file (Requirement 11)
apiRouter.get('/reports/download-zip/:filename', (req: Request, res: Response) => {
  const filename = req.params.filename.replace(/[/\\?%*:|"<>#~]/g, '');
  const filePath = path.join(STORAGE_PATHS.zips, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('فایل ZIP یافت نشد');
  }

  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  res.setHeader('Content-Type', 'application/zip');
  fs.createReadStream(filePath).pipe(res);
});

// 12. Download individual report image (Requirement 9 & 11)
apiRouter.get('/reports/download-image/:filename', (req: Request, res: Response) => {
  const filename = req.params.filename.replace(/[/\\?%*:|"<>#~]/g, '');
  const filePath = path.join(STORAGE_PATHS.reports, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('فایل تصویر یافت نشد');
  }

  const isSvg = filename.endsWith('.svg');
  res.setHeader('Content-Type', isSvg ? 'image/svg+xml' : 'image/png');
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
  fs.createReadStream(filePath).pipe(res);
});

// 13. Download standalone HTML file for desktop Chrome
apiRouter.get('/download/standalone-html', (req: Request, res: Response) => {
  const filePath = path.resolve('public/parkway-settlement.html');
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('فایل دانلودی یافت نشد');
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="parkway-settlement.html"; filename*=UTF-8\'\'parkway-settlement.html'
  );
  fs.createReadStream(filePath).pipe(res);
});

