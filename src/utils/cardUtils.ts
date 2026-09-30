import { SettledCase } from '../types';
import { rialToToman } from './formatters';

// Convert number to Persian digits with thousands separator
export function formatPersianNumber(num: number): string {
  const formatted = num.toLocaleString('en-US');
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return formatted.replace(/[0-9]/g, (w) => persianDigits[+w]);
}

// Convert English numbers in string to Persian digits
export function toPersianDigits(str: string | number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(str).replace(/[0-9]/g, (w) => persianDigits[+w]);
}

// Requirement 9: Sanitize filename for safe storage
// Example: فاطمه_صفری_پرونده_12345.png
export function generateSanitizedFilename(customerName: string, caseId: string, ext = 'png'): string {
  const cleanName = customerName
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[/\\?%*:|"<>#~]/g, '');
  const cleanCaseId = caseId.replace(/[/\\?%*:|"<>#~]/g, '_');
  return `${cleanName}_پرونده_${cleanCaseId}.${ext}`;
}

// Convert amount to Toman string with / separator e.g. ۲۵/۵۵۰/۰۰۰
export function formatTomanWithSlash(num: number): string {
  const rounded = Math.round(num);
  const formatted = rounded.toLocaleString('en-US').replace(/,/g, '/');
  return toPersianDigits(formatted);
}

// Graphic card SVG generator matching Annotation 2026-09-30 095105.png
export function generateCardSvg(settledCase: SettledCase): string {
  const customerName = (settledCase.customerName || 'مشتری گرامی').trim();
  
  // Requirement: Table strictly matches the number of installments, removing all extra rows
  const actualInstallments = settledCase.installments || [];
  const installmentCount = actualInstallments.length > 0 
    ? actualInstallments.length 
    : (settledCase.installmentCount || 1);

  let singleAmountToman = settledCase.installmentAmountToman || 0;
  if (!singleAmountToman && settledCase.installmentAmountRial) {
    singleAmountToman = rialToToman(settledCase.installmentAmountRial);
  }
  if (!singleAmountToman && actualInstallments.length > 0) {
    const first = actualInstallments[0] as { amountToman?: number; amountRial?: number; paidAmountToman?: number };
    singleAmountToman = first.amountToman || first.paidAmountToman || rialToToman(first.amountRial || 0);
  }
  if (!singleAmountToman && settledCase.totalSettledToman && installmentCount > 0) {
    singleAmountToman = Math.round(settledCase.totalSettledToman / installmentCount);
  }

  const formattedSingleAmount = singleAmountToman > 0
    ? formatTomanWithSlash(singleAmountToman)
    : '۰';
    
  // Header left text matching screenshot: e.g. "۳ * ۲۵/۰۰۰/۰۰۰"
  const leftHeader = `${toPersianDigits(installmentCount)} * ${formattedSingleAmount}`;

  // Dimensions: height precisely fits row count, eliminating any extra empty rows
  const rowHeight = 44;
  const headerHeight = 52;
  const margin = 8;
  const col1Width = 56;  // Right column (Yellow Row numbers)
  const col2Width = 196; // Middle column (Dates in red)
  const col3Width = 208; // Left column (Amounts in blue with / separator)
  const tableWidth = col1Width + col2Width + col3Width; // 460px
  const totalWidth = tableWidth + (margin * 2); // 476px
  const totalHeight = headerHeight + (installmentCount * rowHeight) + (margin * 2);

  const xCol1 = margin + col2Width + col3Width; // Rightmost X (yellow column)
  const xCol2 = margin + col3Width;             // Middle X (date column)
  const xCol3 = margin;                         // Leftmost X (amount column)

  const rowsSvg = Array.from({ length: installmentCount }, (_, i) => {
    const rowNum = i + 1;
    const y = margin + headerHeight + (i * rowHeight);
    const inst = actualInstallments[i];

    // Middle column: date in red (matching e.g. ۱۴۰۵/۷/۸ without leading zeroes if available)
    let dateText = '';
    if (inst && inst.paymentDate) {
      const cleanDate = inst.paymentDate.split(' ')[0].replace(/-/g, '/');
      const parts = cleanDate.split('/');
      if (parts.length === 3) {
        const yStr = parts[0];
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        dateText = toPersianDigits(`${yStr}/${m}/${d}`);
      } else {
        dateText = toPersianDigits(cleanDate);
      }
    } else if (settledCase.settlementDate) {
      const cleanDate = settledCase.settlementDate.replace(/-/g, '/');
      const parts = cleanDate.split('/');
      if (parts.length === 3) {
        const yStr = parts[0];
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        dateText = toPersianDigits(`${yStr}/${m}/${d}`);
      } else {
        dateText = toPersianDigits(cleanDate);
      }
    }

    // Left column: paid amount in Toman (مبلغ پرداختی به تومان) with / separator
    let amountText = '';
    if (inst) {
      const instAny = inst as { 
        paidAmountToman?: number; 
        paidAmountRial?: number; 
        amountToman?: number; 
        amountRial?: number 
      };
      let paidToman = 0;
      if (instAny.paidAmountToman && instAny.paidAmountToman > 0) {
        paidToman = instAny.paidAmountToman;
      } else if (instAny.paidAmountRial && instAny.paidAmountRial > 0) {
        paidToman = rialToToman(instAny.paidAmountRial);
      } else if (instAny.amountToman && instAny.amountToman > 0) {
        paidToman = instAny.amountToman;
      } else if (instAny.amountRial && instAny.amountRial > 0) {
        paidToman = rialToToman(instAny.amountRial);
      } else {
        paidToman = singleAmountToman;
      }

      if (paidToman > 0) {
        amountText = formatTomanWithSlash(paidToman);
      }
    } else if (singleAmountToman > 0) {
      amountText = formatTomanWithSlash(singleAmountToman);
    }

    return `
      <!-- Row ${rowNum} -->
      <g>
        <!-- Col 1 (Right): Yellow Background, Black Row Number -->
        <rect x="${xCol1}" y="${y}" width="${col1Width}" height="${rowHeight}" fill="#ffb700" stroke="#000000" stroke-width="2" />
        <text x="${xCol1 + (col1Width / 2)}" y="${y + 30}" font-family="'primary-font', 'IRANYekan', 'IRANYekanFaNum', 'B Titr', 'Vazirmatn', 'Tahoma', sans-serif" font-size="23" font-weight="900" fill="#000000" text-anchor="middle">
          ${toPersianDigits(rowNum)}
        </text>

        <!-- Col 2 (Middle): White Background, BOLD RED Date -->
        <rect x="${xCol2}" y="${y}" width="${col2Width}" height="${rowHeight}" fill="#ffffff" stroke="#000000" stroke-width="2" />
        <text x="${xCol2 + (col2Width / 2)}" y="${y + 29}" font-family="'primary-font', 'IRANYekan', 'IRANYekanFaNum', 'B Titr', 'Vazirmatn', 'Tahoma', sans-serif" font-size="20" font-weight="900" fill="#e60000" text-anchor="middle" direction="rtl">
          ${dateText}
        </text>

        <!-- Col 3 (Left): White Background, BOLD BLUE Paid Amount in Toman with / Separator -->
        <rect x="${xCol3}" y="${y}" width="${col3Width}" height="${rowHeight}" fill="#ffffff" stroke="#000000" stroke-width="2" />
        <text x="${xCol3 + (col3Width / 2)}" y="${y + 30}" font-family="'primary-font', 'IRANYekan', 'IRANYekanFaNum', 'B Titr', 'Vazirmatn', 'Tahoma', sans-serif" font-size="21" font-weight="900" fill="#0070ba" text-anchor="middle" direction="ltr">
          ${amountText}
        </text>
      </g>
    `;
  }).join('');

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" dir="rtl">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@700;800;900&amp;display=swap');
      @import url('https://admin.parkwaykala.ir/assets/vendor/fonts/farsi-fonts-styles-fa-num/primary-iran-yekan.css');
      text {
        font-family: 'primary-font', 'IRANYekan', 'IRANYekanFaNum', 'B Titr', 'BTitr', 'Vazirmatn', 'Tahoma', sans-serif;
        font-feature-settings: 'ss01' 1, 'ss02' 1;
        -webkit-font-smoothing: antialiased;
      }
    </style>
  </defs>

  <!-- Outer Background -->
  <rect x="0" y="0" width="${totalWidth}" height="${totalHeight}" fill="#ffffff" />

  <!-- Table Headers matching Annotation 2026-09-30 095105.png -->
  <!-- Col 1 Header (Right): Solid Black -->
  <rect x="${xCol1}" y="${margin}" width="${col1Width}" height="${headerHeight}" fill="#000000" stroke="#000000" stroke-width="2" />

  <!-- Col 2 Header (Middle): Peach/Salmon background, Customer Name -->
  <rect x="${xCol2}" y="${margin}" width="${col2Width}" height="${headerHeight}" fill="#f0ab82" stroke="#000000" stroke-width="2" />
  <text x="${xCol2 + (col2Width / 2)}" y="${margin + 34}" font-family="'primary-font', 'IRANYekan', 'IRANYekanFaNum', 'B Titr', 'Vazirmatn', 'Tahoma', sans-serif" font-size="22" font-weight="900" fill="#000000" text-anchor="middle">
    ${customerName}
  </text>

  <!-- Col 3 Header (Left): Peach/Salmon background, from left: Count then Installment Amount -->
  <rect x="${xCol3}" y="${margin}" width="${col3Width}" height="${headerHeight}" fill="#f0ab82" stroke="#000000" stroke-width="2" />
  <text x="${xCol3 + (col3Width / 2)}" y="${margin + 34}" font-family="'primary-font', 'IRANYekan', 'IRANYekanFaNum', 'B Titr', 'Vazirmatn', 'Tahoma', sans-serif" font-size="22" font-weight="900" fill="#000000" text-anchor="middle" direction="ltr">
    ${leftHeader}
  </text>

  <!-- Table Rows: strictly matches installment count -->
  ${rowsSvg}
</svg>
  `.trim();
}
