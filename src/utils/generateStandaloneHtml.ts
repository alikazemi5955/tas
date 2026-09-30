import { SettledCase } from '../types';

export function buildClientStandaloneHtml(cases: SettledCase[]): string {
  const casesJson = JSON.stringify(cases);

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>سامانه تسویه اقساط پارک‌وی کالا (نسخه مستقل دسکتاپ)</title>
  <style>
    /* Reset & Base */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Tahoma, Arial, sans-serif;
    }
    body {
      background-color: #192233;
      color: #f1f5f9;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      line-height: 1.5;
    }
    
    /* Header */
    header {
      background-color: #212b40;
      border-bottom: 1px solid #2b374e;
      padding: 12px 24px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      position: sticky;
      top: 0;
      z-index: 30;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .brand-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #d97706, #b45309);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: 900;
      font-size: 18px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .brand-title {
      font-size: 17px;
      font-weight: 800;
      color: #ffffff;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #94a3b8;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .sync-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border-radius: 9999px;
      background-color: #064e3b;
      color: #34d399;
      border: 1px solid #059669;
      font-size: 11px;
      font-weight: 600;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #10b981;
      box-shadow: 0 0 8px #10b981;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
      100% { opacity: 1; transform: scale(1); }
    }
    .count-badge {
      padding: 5px 12px;
      border-radius: 9999px;
      background-color: #1e293b;
      color: #cbd5e1;
      border: 1px solid #334155;
      font-size: 12px;
      font-weight: 700;
    }

    /* Main Container */
    main {
      flex: 1;
      max-width: 1280px;
      width: 100%;
      margin: 0 auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Control Bar */
    .controls-bar {
      background-color: #20293d;
      border: 1px solid #2b374e;
      border-radius: 12px 12px 0 0;
      padding: 16px 20px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .controls-title {
      font-size: 14px;
      font-weight: 700;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .controls-title small {
      font-size: 12px;
      font-weight: 400;
      color: #94a3b8;
    }
    .search-input-wrap {
      position: relative;
      width: 300px;
      max-width: 100%;
    }
    .search-input {
      width: 100%;
      background-color: #192233;
      border: 1px solid #33415c;
      color: #f1f5f9;
      border-radius: 8px;
      padding: 8px 36px 8px 12px;
      font-size: 13px;
      outline: none;
      transition: border-color 0.2s;
    }
    .search-input:focus {
      border-color: #f59e0b;
    }
    .search-icon {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      color: #64748b;
      pointer-events: none;
    }

    /* Table Container */
    .table-container {
      background-color: #20293d;
      border: 1px solid #2b374e;
      border-top: none;
      border-radius: 0 0 12px 12px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
    }
    .table-scroll {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: right;
      font-size: 13px;
    }
    thead th {
      background-color: #212b40;
      color: #cbd5e1;
      font-weight: 700;
      padding: 12px 16px;
      border-bottom: 1px solid #2b374e;
      border-left: 1px solid #2b374e;
      white-space: nowrap;
      user-select: none;
    }
    thead th.sortable {
      cursor: pointer;
      transition: background-color 0.15s;
    }
    thead th.sortable:hover {
      background-color: #27344e;
    }
    tbody tr {
      background-color: #20293d;
      border-bottom: 1px solid #2b374e;
      transition: background-color 0.15s;
    }
    tbody tr:hover {
      background-color: #26334a;
    }
    tbody td {
      padding: 14px 16px;
      border-left: 1px solid #2b374e;
      color: #e2e8f0;
      white-space: nowrap;
    }
    tbody td.text-center, thead th.text-center {
      text-align: center;
    }
    tbody tr:last-child {
      border-bottom: none;
    }

    /* Action Buttons in Table */
    .action-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      background-color: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      transition: all 0.15s;
    }
    .action-btn:hover {
      color: #ffffff;
      background-color: #334155;
    }

    /* Pagination */
    .pagination-bar {
      background-color: #212b40;
      border-top: 1px solid #2b374e;
      padding: 14px 20px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      font-size: 12px;
    }
    .pagination-info {
      color: #94a3b8;
    }
    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .page-btn {
      padding: 6px 12px;
      border-radius: 6px;
      background-color: #192233;
      border: 1px solid #33415c;
      color: #cbd5e1;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .page-btn:hover:not(:disabled) {
      background-color: #27344e;
      color: #ffffff;
    }
    .page-btn.active {
      background-color: #f59e0b;
      color: #0f172a;
      border-color: #f59e0b;
      font-weight: 800;
    }
    .page-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 50;
      background-color: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      overflow-y: auto;
    }
    .modal-backdrop.hidden {
      display: none;
    }
    .modal-box {
      background-color: #ffffff;
      border-radius: 14px;
      max-width: 960px;
      width: 100%;
      max-height: 94vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .modal-header {
      background-color: #283144;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      color: #ffffff;
    }
    .modal-title {
      font-size: 16px;
      font-weight: 800;
      color: #ffffff;
    }
    .modal-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .modal-btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 700;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s;
    }
    .btn-download {
      background-color: #059669;
      color: #ffffff;
    }
    .btn-download:hover {
      background-color: #047857;
    }
    .btn-print {
      background-color: #0891b2;
      color: #ffffff;
    }
    .btn-print:hover {
      background-color: #0e7490;
    }
    .btn-close {
      background-color: #e11d48;
      color: #ffffff;
    }
    .btn-close:hover {
      background-color: #be123c;
    }
    .modal-body {
      padding: 24px;
      overflow-y: auto;
      background-color: #f8fafc;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .modal-table {
      width: 100%;
      border-collapse: collapse;
      text-align: center;
      font-size: 13px;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }
    .modal-table thead tr {
      background-color: #1e293b;
      color: #ffffff;
      border-bottom: 2px solid #0f172a;
    }
    .modal-table th {
      padding: 12px 10px;
      font-weight: 700;
      text-align: center;
    }
    .modal-table td {
      padding: 12px 10px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
      font-weight: 600;
    }
    .card-preview-wrap {
      display: flex;
      justify-content: center;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      overflow-x: auto;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }

    @media print {
      body * {
        visibility: hidden;
      }
      #modal-content, #modal-content * {
        visibility: visible;
      }
      #modal-content {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        background: white;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <!-- Top Header -->
  <header>
    <div class="brand-wrap">
      <div class="brand-logo">PK</div>
      <div>
        <h1 class="brand-title">سامانه تسویه اقساط پارک‌وی کالا</h1>
        <p class="brand-subtitle">نسخه دسکتاپ (اجرا در گوگل کروم - همگام‌سازی خودکار هر ۳۰ ثانیه)</p>
      </div>
    </div>

    <div class="header-actions">
      <div class="sync-badge" title="هر ۳۰ ثانیه اطلاعات جدید به طور خودکار از پنل مدیریت دریافت می‌شود">
        <span class="pulse-dot"></span>
        <span id="sync-text">همگام‌سازی خودکار (۳۰ ثانیه)</span>
      </div>
      <span id="case-count-badge" class="count-badge">۱۰۸ پرونده</span>
    </div>
  </header>

  <!-- Main Container -->
  <main>
    <!-- Controls Bar -->
    <div class="controls-bar">
      <div class="controls-title">
        <span>لیست پرونده‌های تسویه‌شده</span>
        <small>(نمایش اطلاعات دریافتی از پنل پارک‌وی کالا)</small>
      </div>

      <!-- Search Input -->
      <div class="search-input-wrap">
        <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <input
          type="text"
          id="search-input"
          class="search-input"
          placeholder="جستجو نام مشتری، شماره پرونده..."
        />
      </div>
    </div>

    <!-- Table Container -->
    <div class="table-container">
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th onclick="toggleSort('caseId')" class="sortable text-center" style="width: 80px;">
                <span>ID</span> <span id="sort-caseId" style="font-size: 10px; color: #94a3b8;">▲▼</span>
              </th>
              <th><span>نام کاربر</span></th>
              <th onclick="toggleSort('caseNumber')" class="sortable text-center">
                <span>شماره پرونده</span> <span id="sort-caseNumber" style="font-size: 10px; color: #94a3b8;">▲▼</span>
              </th>
              <th onclick="toggleSort('shopName')" class="sortable text-center">
                <span>نام فروشگاه</span> <span id="sort-shopName" style="font-size: 10px; color: #94a3b8;">▲▼</span>
              </th>
              <th onclick="toggleSort('sponsor')" class="sortable text-center">
                <span>اسپانسر</span> <span id="sort-sponsor" style="font-size: 10px; color: #94a3b8;">▲▼</span>
              </th>
              <th onclick="toggleSort('settlementDateTime')" class="sortable text-center">
                <span>تاریخ تسویه</span> <span id="sort-settlementDateTime" style="font-size: 10px; color: #f59e0b; font-weight: bold;">▼</span>
              </th>
              <th class="text-center" style="width: 90px;"><span>دستور</span></th>
            </tr>
          </thead>
          <tbody id="table-body">
            <!-- Rendered by JS -->
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination-bar">
        <div class="pagination-info" id="pagination-info">
          در حال بارگذاری اطلاعات...
        </div>
        <div class="pagination-controls" id="pagination-controls">
          <!-- Rendered by JS -->
        </div>
      </div>
    </div>
  </main>

  <!-- Modal for Installments Breakdown & Designed Card -->
  <div id="modal-container" class="modal-backdrop hidden">
    <div id="modal-content" class="modal-box">
      <!-- Modal Header -->
      <div class="modal-header">
        <h2 id="modal-title" class="modal-title">لیست اقساط پرونده</h2>
        <div class="modal-actions no-print">
          <button id="modal-download-btn" class="modal-btn btn-download">
            <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            <span>دانلود کارت</span>
          </button>
          <button onclick="window.print()" class="modal-btn btn-print">چاپ</button>
          <button onclick="closeModal()" class="modal-btn btn-close">بازگشت به لیست</button>
        </div>
      </div>

      <!-- Modal Body -->
      <div class="modal-body">
        <!-- Installments Table -->
        <div style="overflow-x: auto;">
          <table class="modal-table">
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th>مبلغ قسط (ریال)</th>
                <th>مبلغ جریمه (ریال)</th>
                <th>مبلغ پرداختی (تومان)</th>
                <th>وضعیت</th>
                <th>زمان پرداخت</th>
              </tr>
            </thead>
            <tbody id="modal-tbody">
              <!-- Rendered by JS -->
            </tbody>
          </table>
        </div>

        <!-- Designed Settlement Slip Card (بدون باکس سورمه‌ای) -->
        <div class="card-preview-wrap">
          <div id="modal-card-svg-container">
            <!-- SVG rendered by JS -->
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Embedded Data Snapshot
    const INITIAL_EMBEDDED_CASES = ${casesJson};

    // Safe localStorage retrieval
    let localSaved = null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('parkway_synced_cases');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localSaved = parsed;
          }
        }
      }
    } catch(e) {
      console.warn('localStorage read warning:', e);
    }

    let ALL_CASES = localSaved || INITIAL_EMBEDDED_CASES;

    // State
    let filteredCases = [...ALL_CASES];
    let currentPage = 1;
    const pageSize = 10;
    let sortField = 'settlementDateTime';
    let sortOrder = 'desc';
    let currentSearchQuery = '';

    // Remote Sync API URL (Absolute HTTPS)
    const REMOTE_API = 'https://ais-pre-oyaflwdhjw6yo5ep2jwhjc-171493547477.us-east1.run.app/api/cases';

    // Persian Digits Helper
    function toPersianDigits(n) {
      if (n === null || n === undefined) return '';
      const farsi = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
      return String(n).replace(/[0-9]/g, w => farsi[+w]);
    }

    function rialToToman(rial) {
      if (!rial || isNaN(rial)) return 0;
      return Math.floor(rial / 10);
    }

    function formatTomanWithSlash(num) {
      const rounded = Math.round(num);
      const formatted = rounded.toLocaleString('en-US').replace(/,/g, '/');
      return toPersianDigits(formatted);
    }

    function sanitizeFileName(customerName, caseId, ext) {
      ext = ext || 'png';
      const cleanName = (customerName || 'مشتری').trim().replace(/[/\\\\?%*:|"<>]/g, '_').replace(/\\s+/g, '_');
      const cleanCaseId = (caseId || '').toString().trim().replace(/[/\\\\?%*:|"<>]/g, '_');
      return cleanName + '_پرونده_' + cleanCaseId + '.' + ext;
    }

    // Card Vector SVG Generator
    function generateCardSvg(c) {
      const customerName = (c.customerName || 'مشتری گرامی').trim();
      const actualInstallments = c.installments || [];
      const installmentCount = actualInstallments.length > 0 
        ? actualInstallments.length 
        : (c.installmentCount || 1);

      let singleAmountToman = c.installmentAmountToman || 0;
      if (!singleAmountToman && c.installmentAmountRial) {
        singleAmountToman = rialToToman(c.installmentAmountRial);
      }
      if (!singleAmountToman && actualInstallments.length > 0) {
        const first = actualInstallments[0];
        singleAmountToman = first.amountToman || first.paidAmountToman || rialToToman(first.amountRial || 0);
      }
      if (!singleAmountToman && c.totalSettledToman && installmentCount > 0) {
        singleAmountToman = Math.round(c.totalSettledToman / installmentCount);
      }

      const formattedSingleAmount = singleAmountToman > 0
        ? formatTomanWithSlash(singleAmountToman)
        : '۰';
        
      const leftHeader = toPersianDigits(installmentCount) + ' * ' + formattedSingleAmount;

      const rowHeight = 44;
      const headerHeight = 52;
      const margin = 8;
      const col1Width = 56;
      const col2Width = 196;
      const col3Width = 208;
      const tableWidth = col1Width + col2Width + col3Width;
      const totalWidth = tableWidth + (margin * 2);
      const totalHeight = headerHeight + (installmentCount * rowHeight) + (margin * 2);

      const xCol1 = margin + col2Width + col3Width;
      const xCol2 = margin + col3Width;
      const xCol3 = margin;

      let rowsSvg = '';
      for (let i = 0; i < installmentCount; i++) {
        const rowNum = i + 1;
        const y = margin + headerHeight + (i * rowHeight);
        const inst = actualInstallments[i];

        let dateText = '';
        if (inst && inst.paymentDate) {
          const cleanDate = inst.paymentDate.split(' ')[0].replace(/-/g, '/');
          const parts = cleanDate.split('/');
          if (parts.length === 3) {
            dateText = toPersianDigits(parts[0] + '/' + parseInt(parts[1], 10) + '/' + parseInt(parts[2], 10));
          } else {
            dateText = toPersianDigits(cleanDate);
          }
        } else if (c.settlementDate) {
          const cleanDate = c.settlementDate.replace(/-/g, '/');
          const parts = cleanDate.split('/');
          if (parts.length === 3) {
            dateText = toPersianDigits(parts[0] + '/' + parseInt(parts[1], 10) + '/' + parseInt(parts[2], 10));
          } else {
            dateText = toPersianDigits(cleanDate);
          }
        }

        let amountText = '';
        if (inst) {
          let paidToman = 0;
          if (inst.paidAmountToman && inst.paidAmountToman > 0) paidToman = inst.paidAmountToman;
          else if (inst.paidAmountRial && inst.paidAmountRial > 0) paidToman = rialToToman(inst.paidAmountRial);
          else if (inst.amountToman && inst.amountToman > 0) paidToman = inst.amountToman;
          else if (inst.amountRial && inst.amountRial > 0) paidToman = rialToToman(inst.amountRial);
          else paidToman = singleAmountToman;

          if (paidToman > 0) amountText = formatTomanWithSlash(paidToman);
        } else if (singleAmountToman > 0) {
          amountText = formatTomanWithSlash(singleAmountToman);
        }

        rowsSvg += \`
          <g>
            <rect x="\${xCol1}" y="\${y}" width="\${col1Width}" height="\${rowHeight}" fill="#ffb700" stroke="#000000" stroke-width="2" />
            <text x="\${xCol1 + (col1Width / 2)}" y="\${y + 30}" font-family="'Vazirmatn', sans-serif" font-size="23" font-weight="900" fill="#000000" text-anchor="middle">
              \${toPersianDigits(rowNum)}
            </text>

            <rect x="\${xCol2}" y="\${y}" width="\${col2Width}" height="\${rowHeight}" fill="#ffffff" stroke="#000000" stroke-width="2" />
            <text x="\${xCol2 + (col2Width / 2)}" y="\${y + 29}" font-family="'Vazirmatn', sans-serif" font-size="20" font-weight="900" fill="#e60000" text-anchor="middle" direction="rtl">
              \${dateText}
            </text>

            <rect x="\${xCol3}" y="\${y}" width="\${col3Width}" height="\${rowHeight}" fill="#ffffff" stroke="#000000" stroke-width="2" />
            <text x="\${xCol3 + (col3Width / 2)}" y="\${y + 30}" font-family="'Vazirmatn', sans-serif" font-size="21" font-weight="900" fill="#0070ba" text-anchor="middle" direction="ltr">
              \${amountText}
            </text>
          </g>
        \`;
      }

      return \`
        <svg xmlns="http://www.w3.org/2000/svg" width="\${totalWidth}" height="\${totalHeight}" viewBox="0 0 \${totalWidth} \${totalHeight}" dir="rtl">
          <rect x="0" y="0" width="\${totalWidth}" height="\${totalHeight}" fill="#ffffff" />
          <rect x="\${xCol1}" y="\${margin}" width="\${col1Width}" height="\${headerHeight}" fill="#000000" stroke="#000000" stroke-width="2" />
          <rect x="\${xCol2}" y="\${margin}" width="\${col2Width}" height="\${headerHeight}" fill="#f0ab82" stroke="#000000" stroke-width="2" />
          <text x="\${xCol2 + (col2Width / 2)}" y="\${margin + 34}" font-family="'Vazirmatn', -apple-system, sans-serif" font-size="22" font-weight="900" fill="#000000" text-anchor="middle">
            \${customerName}
          </text>
          <rect x="\${xCol3}" y="\${margin}" width="\${col3Width}" height="\${headerHeight}" fill="#f0ab82" stroke="#000000" stroke-width="2" />
          <text x="\${xCol3 + (col3Width / 2)}" y="\${margin + 34}" font-family="'Vazirmatn', -apple-system, sans-serif" font-size="22" font-weight="900" fill="#000000" text-anchor="middle" direction="ltr">
            \${leftHeader}
          </text>
          \${rowsSvg}
        </svg>
      \`.trim();
    }

    // Download PNG from SVG
    function downloadSvgAsPng(c) {
      try {
        const svgString = generateCardSvg(c);
        const filename = sanitizeFileName(c.customerName, c.caseId, 'png');
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const URL = window.URL || window.webkitURL || window;
        const blobURL = URL.createObjectURL(blob);
        const image = new Image();
        
        image.onload = () => {
          const scale = 2;
          const canvas = document.createElement('canvas');
          canvas.width = image.width * scale;
          canvas.height = image.height * scale;
          const ctx = canvas.getContext('2d');
          ctx.scale(scale, scale);
          ctx.drawImage(image, 0, 0);
          
          canvas.toBlob(pngBlob => {
            if (!pngBlob) return;
            const pngUrl = URL.createObjectURL(pngBlob);
            const link = document.createElement('a');
            link.href = pngUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(pngUrl);
            URL.revokeObjectURL(blobURL);
          }, 'image/png');
        };
        image.src = blobURL;
      } catch (err) {
        console.error('Download error:', err);
      }
    }

    // Render Table
    function renderTable() {
      const tbody = document.getElementById('table-body');
      if (!tbody) return;

      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;
      const pageData = filteredCases.slice(start, end);

      if (pageData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding: 40px; color: #94a3b8;">هیچ پرونده‌ای یافت نشد.</td></tr>';
        document.getElementById('pagination-info').innerText = '۰ پرونده';
        document.getElementById('pagination-controls').innerHTML = '';
        return;
      }

      let html = '';
      for (let i = 0; i < pageData.length; i++) {
        const c = pageData[i];
        html += \`
          <tr>
            <td class="text-center font-bold" style="font-family: sans-serif;">\${toPersianDigits(c.caseId)}</td>
            <td style="font-weight: 600;">\${c.customerName || '-'}</td>
            <td class="text-center" style="font-family: sans-serif;">\${toPersianDigits(c.caseNumber || c.caseId)}</td>
            <td class="text-center" style="color: #94a3b8;">\${c.shopName || 'پارک وی'}</td>
            <td class="text-center" style="color: #94a3b8;">\${c.sponsor || 'اسپانسر بقولی فرد'}</td>
            <td class="text-center" style="font-family: sans-serif;">\${toPersianDigits(c.settlementDateTime || c.settlementDate || '')}</td>
            <td class="text-center">
              <button onclick="openModal('\${c.caseId}')" class="action-btn" title="مشاهده اقساط">
                <svg style="width: 18px; height: 18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
              </button>
              <button onclick="downloadRowCard('\${c.caseId}')" class="action-btn" title="دانلود کارت">
                <svg style="width: 18px; height: 18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
              </button>
            </td>
          </tr>
        \`;
      }
      tbody.innerHTML = html;

      // Pagination
      const totalPages = Math.ceil(filteredCases.length / pageSize) || 1;
      const infoEl = document.getElementById('pagination-info');
      if (infoEl) {
        infoEl.innerText = 'نمایش ' + toPersianDigits(start + 1) + ' تا ' + toPersianDigits(Math.min(end, filteredCases.length)) + ' از ' + toPersianDigits(filteredCases.length) + ' پرونده';
      }
      
      let pBtns = \`
        <button onclick="changePage(\${currentPage - 1})" class="page-btn" \${currentPage <= 1 ? 'disabled' : ''}>قبلی</button>
      \`;
      for (let p = Math.max(1, currentPage - 2); p <= Math.min(totalPages, currentPage + 2); p++) {
        pBtns += \`<button onclick="changePage(\${p})" class="page-btn \${p === currentPage ? 'active' : ''}">\${toPersianDigits(p)}</button>\`;
      }
      pBtns += \`
        <button onclick="changePage(\${currentPage + 1})" class="page-btn" \${currentPage >= totalPages ? 'disabled' : ''}>بعدی</button>
      \`;
      const ctrlEl = document.getElementById('pagination-controls');
      if (ctrlEl) ctrlEl.innerHTML = pBtns;
    }

    function changePage(p) {
      const totalPages = Math.ceil(filteredCases.length / pageSize) || 1;
      if (p < 1 || p > totalPages) return;
      currentPage = p;
      renderTable();
    }

    function toggleSort(field) {
      if (sortField === field) {
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        sortField = field;
        sortOrder = 'desc';
      }

      ['caseId', 'caseNumber', 'shopName', 'sponsor', 'settlementDateTime'].forEach(f => {
        const el = document.getElementById('sort-' + f);
        if (el) {
          if (f === sortField) {
            el.innerText = sortOrder === 'asc' ? '▲' : '▼';
            el.style.color = '#f59e0b';
            el.style.fontWeight = 'bold';
          } else {
            el.innerText = '▲▼';
            el.style.color = '#94a3b8';
            el.style.fontWeight = 'normal';
          }
        }
      });

      filteredCases.sort((a, b) => {
        const valA = a[sortField] || '';
        const valB = b[sortField] || '';
        return sortOrder === 'asc' ? String(valA).localeCompare(String(valB), 'fa') : String(valB).localeCompare(String(valA), 'fa');
      });

      currentPage = 1;
      renderTable();
    }

    // Modal
    function openModal(caseId) {
      const c = ALL_CASES.find(item => String(item.caseId) === String(caseId));
      if (!c) return;

      const caseNum = c.caseNumber || c.caseId;
      document.getElementById('modal-title').innerText = 'لیست اقساط پرونده شماره ' + toPersianDigits(caseNum) + ' (' + c.customerName + ')';
      
      const installments = c.installments || [];
      const singleInstRial = installments[0]?.amountRial || c.installmentAmountRial || 0;

      let tbodyHtml = '';
      if (installments.length > 0) {
        installments.forEach((inst, idx) => {
          const rowNum = inst.index || idx + 1;
          const instRial = inst.amountRial || singleInstRial;
          const penaltyRial = inst.penaltyAmountRial || 0;
          const paidRial = inst.paidAmountRial || (instRial + penaltyRial);
          const paidToman = inst.paidAmountToman || rialToToman(paidRial);

          tbodyHtml += \`
            <tr>
              <td>\${toPersianDigits(rowNum)}</td>
              <td>\${toPersianDigits(instRial.toLocaleString('en-US'))}</td>
              <td>\${toPersianDigits(penaltyRial.toLocaleString('en-US'))}</td>
              <td style="color: #1d4ed8; font-weight: 800;">\${toPersianDigits(paidToman.toLocaleString('en-US'))} تومان</td>
              <td><span style="color: #4b6584;">تسویه شده</span></td>
              <td dir="ltr">\${toPersianDigits(inst.paymentDate || c.settlementDateTime || '')}</td>
            </tr>
          \`;
        });
      } else {
        tbodyHtml = '<tr><td colspan="6" style="padding: 24px; color: #64748b;">اطلاعات اقساطی یافت نشد.</td></tr>';
      }
      document.getElementById('modal-tbody').innerHTML = tbodyHtml;

      // Render Vector Graphic Card
      document.getElementById('modal-card-svg-container').innerHTML = generateCardSvg(c);

      document.getElementById('modal-download-btn').onclick = () => downloadSvgAsPng(c);
      document.getElementById('modal-container').classList.remove('hidden');
    }

    function closeModal() {
      document.getElementById('modal-container').classList.add('hidden');
    }

    function downloadRowCard(caseId) {
      const c = ALL_CASES.find(item => String(item.caseId) === String(caseId));
      if (c) downloadSvgAsPng(c);
    }

    function applySearch(q) {
      currentSearchQuery = q;
      if (!q) {
        filteredCases = [...ALL_CASES];
      } else {
        filteredCases = ALL_CASES.filter(c => {
          return (
            (c.customerName && c.customerName.toLowerCase().includes(q)) ||
            (c.caseId && String(c.caseId).includes(q)) ||
            (c.caseNumber && String(c.caseNumber).includes(q)) ||
            (c.shopName && c.shopName.toLowerCase().includes(q)) ||
            (c.sponsor && c.sponsor.toLowerCase().includes(q))
          );
        });
      }
      currentPage = 1;
      renderTable();
    }

    // AUTOMATIC BACKGROUND SYNC EVERY 30 SECONDS
    async function autoSyncWithServer() {
      try {
        const syncText = document.getElementById('sync-text');
        if (syncText) syncText.innerText = 'در حال بررسی...';

        const res = await fetch(REMOTE_API);
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && Array.isArray(data.cases) && data.cases.length > 0) {
            // Check if count or cases changed
            if (data.cases.length !== ALL_CASES.length || JSON.stringify(data.cases[0]) !== JSON.stringify(ALL_CASES[0])) {
              ALL_CASES = data.cases;
              try {
                localStorage.setItem('parkway_synced_cases', JSON.stringify(ALL_CASES));
              } catch(e) {}
              
              applySearch(currentSearchQuery);
              const badge = document.getElementById('case-count-badge');
              if (badge) badge.innerText = toPersianDigits(ALL_CASES.length) + ' پرونده';
            }
          }
        }
      } catch (err) {
        // Silently catch background network error (offline mode)
      } finally {
        const syncText = document.getElementById('sync-text');
        if (syncText) syncText.innerText = 'همگام‌سازی خودکار (۳۰ ثانیه)';
      }
    }

    // Event Listeners
    document.addEventListener('DOMContentLoaded', () => {
      // 1. Initial Render
      toggleSort('settlementDateTime');

      // Update badge
      const badge = document.getElementById('case-count-badge');
      if (badge) badge.innerText = toPersianDigits(ALL_CASES.length) + ' پرونده';

      // 2. Search
      const searchEl = document.getElementById('search-input');
      if (searchEl) {
        searchEl.addEventListener('input', e => {
          applySearch(e.target.value.trim().toLowerCase());
        });
      }

      // 3. Modal close on backdrop
      const modalEl = document.getElementById('modal-container');
      if (modalEl) {
        modalEl.addEventListener('click', e => {
          if (e.target.id === 'modal-container') closeModal();
        });
      }
      window.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeModal();
      });

      // 4. Start 30-second automated sync
      setInterval(autoSyncWithServer, 30000);
      // Run first check after 2 seconds
      setTimeout(autoSyncWithServer, 2000);
    });

    // Fallback immediate execution in case DOMContentLoaded already fired
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      renderTable();
    }
  </script>
</body>
</html>
`;
}
