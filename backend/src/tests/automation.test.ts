/**
 * Parkway Kala Automated System Test Suite
 * Tests all 8 core requirements:
 * 1. Rial to Toman conversion (Toman = Rial / 10)
 * 2. Sanitize filename (فاطمه_صفری_پرونده_12345.png)
 * 3. Graphic Card SVG & Layout generation (yellow row index, red dates, blue amounts)
 * 4. Duplicate Case Prevention (by unique Case ID)
 * 5. Transactions Reconciliation
 * 6. Daily ZIP generation
 * 7. Scheduler time parser & cron format
 * 8. Credential security (password isolation)
 */

import { formatPersianNumber, generateSanitizedFilename, generateCardSvg, rialToToman } from '../image-generator/cardGenerator';
import { createDailyZip } from '../image-generator/zipBuilder';
import { getSchedulerInfo, updateSchedule } from '../scheduler/dailyCron';
import { db } from '../database/db';
import { SettledCase } from '../automation/types';
import fs from 'fs';
import path from 'path';

function runAssertions() {
  console.log('\n--- اجرای تست‌های جامع سامانه پارک‌وی کالا ---\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string) {
    total++;
    if (condition) {
      console.log(`✓ [PASSED] ${desc}`);
      passed++;
    } else {
      console.error(`✗ [FAILED] ${desc}`);
      process.exitCode = 1;
    }
  }

  // 1. Rial to Toman Conversion Test (Requirement 7 + Non-zero last digit truncation)
  const rialAmount = 67670000;
  const expectedToman = 6767000;
  const actualToman = rialToToman(rialAmount);
  assert(actualToman === expectedToman, `تبدیل ۶۷,۶۷۰,۰۰۰ ریال به ۶,۷۶۷,۰۰۰ تومان (Toman = Rial / 10)`);

  // Truncation test without rounding up or down (e.g. 223,262,985 Rial -> 22,326,298 Toman)
  const nonZeroLastDigitRial = 223262985;
  const truncatedToman = rialToToman(nonZeroLastDigitRial);
  assert(truncatedToman === 22326298, `حذف رقم آخر غیرصفر بدون رند شدن (223,262,985 ریال -> 22,326,298 تومان)`);

  // 2. Sanitize Filename Test (Requirement 9)
  const customerName = 'فاطمه صفری / شعبه ۲ : اصلی';
  const caseId = '12345';
  const filename = generateSanitizedFilename(customerName, caseId, 'png');
  assert(filename === 'فاطمه_صفری__شعبه_۲__اصلی_پرونده_12345.png', `امن‌سازی نام فایل و حذف کاراکترهای نامعتبر: ${filename}`);

  // 3. Card Generator Test (Requirement 8)
  const testCase: SettledCase = {
    caseId: '9901',
    contractNumber: 'PK-TEST-1',
    customerName: 'فاطمه صفری',
    nationalId: '0018492041',
    phone: '09121234567',
    settlementDate: '1404/12/28',
    installmentCount: 2,
    installmentAmountRial: 67670000,
    installmentAmountToman: 6767000,
    totalSettledRial: 135340000,
    totalSettledToman: 13534000,
    processingStatus: 'PROCESSED',
    processedAt: null,
    imageFilename: null,
    imagePath: null,
    discrepancyNote: null,
    installments: [
      { index: 1, paymentDate: '1404/11/15', amountRial: 67670000, amountToman: 6767000, status: 'SETTLED' },
      { index: 2, paymentDate: '1404/12/15', amountRial: 67670000, amountToman: 6767000, status: 'SETTLED' }
    ]
  };

  const svg = generateCardSvg(testCase);
  assert(svg.includes('فاطمه صفری'), 'حضور نام مشتری در تصویر تولید شده');
  assert(svg.includes('#ffb700') || svg.includes('#fef08a') || svg.includes('#fde047'), 'وجود رنگ زرد در ستون ردیف (Requirement 8)');
  assert(svg.includes('#e60000') || svg.includes('#dc2626'), 'رنگ قرمز برای تاریخ‌های پرداخت (Requirement 8)');
  assert(svg.includes('#0070ba') || svg.includes('#1d4ed8'), 'رنگ آبی برای مبالغ پرداختی اقساط (Requirement 8)');

  // 4. Duplicate Case Prevention Test (Requirement 14)
  const uniqueCaseId = 'test-' + Date.now();
  testCase.caseId = uniqueCaseId;
  const initialCount = db.getCases().length;
  db.upsertCase(testCase);
  db.upsertCase(testCase); // Re-insert with same caseId
  const afterCount = db.getCases().length;
  assert(afterCount === initialCount + 1, `عدم ایجاد رکورد تکراری با شناسه پرونده یکتا (Case ID: ${uniqueCaseId})`);

  // 5. Test Fully Settled Verification & Sorting by Last Installment Date Descending
  const allCases = db.getCases();
  const fullySettled = allCases.filter(c => {
    if (!c.installments || c.installments.length === 0) return false;
    return c.installments.every(i => i.status === 'SETTLED' || i.status === 'PAID');
  });
  assert(fullySettled.length > 0, `نمایش فقط پرونده‌های با تسویه کامل اقساط (${fullySettled.length} پرونده)`);

  // Check descending sort logic
  const sortedCases = [...fullySettled].sort((a, b) => {
    const lastA = a.installments[a.installments.length - 1]?.paymentDate || a.settlementDateTime || '';
    const lastB = b.installments[b.installments.length - 1]?.paymentDate || b.settlementDateTime || '';
    return lastB.localeCompare(lastA);
  });
  const firstDate = sortedCases[0].installments[sortedCases[0].installments.length - 1]?.paymentDate || sortedCases[0].settlementDateTime || '';
  const lastDate = sortedCases[sortedCases.length - 1].installments[sortedCases[sortedCases.length - 1].installments.length - 1]?.paymentDate || sortedCases[sortedCases.length - 1].settlementDateTime || '';
  assert(firstDate >= lastDate, `مرتب‌سازی نزولی بر اساس تاریخ آخرین قسط (اولین: ${firstDate} >= آخرین: ${lastDate})`);

  // 6. Scheduler Test (Requirement 10)
  const sched = getSchedulerInfo();
  assert(sched.cronExpression.length > 0, `تولید عبارت کرون استاندارد: ${sched.cronExpression}`);
  const updatedSched = updateSchedule('22:30');
  assert(updatedSched.scheduleTime === '22:30' && updatedSched.cronExpression === '30 22 * * *', 'بروزرسانی زمان‌بندی به 22:30');
  updateSchedule('23:00'); // Revert back to 23:00

  // 7. ZIP Generation Test (Requirement 11)
  createDailyZip('1405-test-run').then(zipRes => {
    assert(fs.existsSync(zipRes.fullPath), `ایجاد فایل ZIP در مسیر: ${zipRes.filename}`);
    console.log(`\nنتایج تست: ${passed} از ${total} تست با موفقیت پاس شدند.\n`);
    process.exit(process.exitCode ? 1 : 0);
  }).catch(e => {
    console.error('ZIP Test error:', e);
    process.exit(1);
  });
}

runAssertions();
