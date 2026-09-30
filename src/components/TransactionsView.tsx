import React, { useState, useMemo } from 'react';
import { Search, X, Download } from 'lucide-react';
import { Transaction } from '../types';
import { toPersianDigits, rialToToman } from '../utils/formatters';

interface TransactionsViewProps {
  transactions: Transaction[];
  onUpdateDiscrepancy?: (txId: string, note: string, status?: 'MATCHED' | 'DISCREPANCY' | 'UNLINKED') => void;
  onFilterByCase?: (caseId: string) => void;
}

// Authentic Saman Kish (سپ) Gateway Logo component matching screenshot
const SepBankLogo: React.FC = () => {
  const [imgError, setImgError] = React.useState(false);

  if (!imgError) {
    return (
      <img
        src="https://admin.parkwaykala.ir/assets/img/gateway/saman.png"
        alt="سپ"
        className="w-11 h-auto object-contain inline-block cursor-pointer select-none"
        title="پرداخت الکترونیک سامان (سپ)"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className="inline-flex items-center justify-center gap-1 select-none" title="پرداخت الکترونیک سامان (سپ)">
      <div className="flex items-center">
        <span className="text-[#009ee2] font-black text-xl tracking-tighter" style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}>
          سپ
        </span>
        <div className="flex flex-col gap-0.5 mr-1">
          <div className="w-1.5 h-1.5 bg-[#009ee2] rounded-2xs"></div>
          <div className="flex gap-0.5">
            <div className="w-1.5 h-1.5 bg-[#009ee2] rounded-2xs"></div>
            <div className="w-1.5 h-1.5 bg-[#00c0f3] rounded-2xs"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
}) => {
  // Search Modal state
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Filter form states
  const [filterCustomerName, setFilterCustomerName] = useState('');
  const [filterPhone, setFilterPhone] = useState('');
  const [filterNationalId, setFilterNationalId] = useState('');
  const [filterSponsor, setFilterSponsor] = useState('همه');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  // Applied filters state
  const [appliedFilters, setAppliedFilters] = useState({
    customerName: '',
    phone: '',
    nationalId: '',
    sponsor: 'همه',
    fromDate: '',
    toDate: '',
  });

  const handleApplySearch = () => {
    setAppliedFilters({
      customerName: filterCustomerName,
      phone: filterPhone,
      nationalId: filterNationalId,
      sponsor: filterSponsor,
      fromDate: filterFromDate,
      toDate: filterToDate,
    });
    setIsSearchModalOpen(false);
  };

  const handleResetFilters = () => {
    setFilterCustomerName('');
    setFilterPhone('');
    setFilterNationalId('');
    setFilterSponsor('همه');
    setFilterFromDate('');
    setFilterToDate('');
    setAppliedFilters({
      customerName: '',
      phone: '',
      nationalId: '',
      sponsor: 'همه',
      fromDate: '',
      toDate: '',
    });
    setIsSearchModalOpen(false);
  };

  // CSV Export for the download button in modal
  const handleExportCSV = () => {
    const headers = ['#', 'نام کاربر', 'شماره ملی', 'موبایل', 'مبلغ واریزی', 'درگاه بانک', 'تاریخ واریز'];
    const rows = filteredTransactions.map((t, idx) => [
      idx + 1,
      t.customerName,
      t.nationalId || '',
      t.phone || '',
      t.amountToman || rialToToman(t.amountRial),
      t.gateway || 'سپ',
      t.paymentDate || ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter transactions based on applied filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (appliedFilters.customerName && !t.customerName.toLowerCase().includes(appliedFilters.customerName.toLowerCase())) {
        return false;
      }
      if (appliedFilters.phone && t.phone && !t.phone.includes(appliedFilters.phone)) {
        return false;
      }
      if (appliedFilters.nationalId && t.nationalId && !t.nationalId.includes(appliedFilters.nationalId)) {
        return false;
      }
      if (appliedFilters.fromDate && t.paymentDate && t.paymentDate < appliedFilters.fromDate) {
        return false;
      }
      if (appliedFilters.toDate && t.paymentDate && t.paymentDate > appliedFilters.toDate) {
        return false;
      }
      return true;
    });
  }, [transactions, appliedFilters]);

  // Format amount with comma separation and Persian digits (e.g. ۸۱,۵۷۹,۵۰۰)
  const formatAmount = (num: number) => {
    const formatted = num.toLocaleString('en-US');
    return toPersianDigits(formatted);
  };

  return (
    <div className="font-sans text-right select-none w-full" dir="rtl">
      {/* Top Header Bar matching Annotation 2026-09-29 120210.png */}
      <div className="bg-[#243144] px-6 py-4 flex items-center justify-between rounded-t-lg shadow-sm">
        {/* Search Icon Button on Left (matches screenshot) */}
        <button
          onClick={() => setIsSearchModalOpen(true)}
          className="w-12 h-10 bg-[#00acc1] hover:bg-[#0097a7] text-white flex items-center justify-center rounded-md transition-colors cursor-pointer shadow-xs active:scale-95"
          title="جستجو در تراکنش‌ها"
        >
          <Search className="w-5 h-5 text-white stroke-[2.6]" />
        </button>

        {/* Title on Right (matches screenshot) */}
        <h1 className="text-xl font-bold text-white tracking-wide">
          لیست تراکنش ها
        </h1>
      </div>

      {/* Main Table matching Screenshot */}
      <div className="bg-white border-x border-b border-slate-200 rounded-b-lg overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm border-collapse">
            <thead>
              <tr className="bg-white text-slate-800 font-bold border-b border-slate-300">
                <th className="py-4 px-4 text-center w-14">#</th>
                <th className="py-4 px-4">نام کاربر</th>
                <th className="py-4 px-4 text-center">شماره ملی</th>
                <th className="py-4 px-4 text-center">موبایل</th>
                <th className="py-4 px-4 text-center">مبلغ واریزی</th>
                <th className="py-4 px-4 text-center">درگاه بانک</th>
                <th className="py-4 px-4 text-center">تاریخ واریز</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 text-slate-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 bg-white">
                    تراکنشی مطابق با جستجوی شما یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t, idx) => {
                  const displayAmount = t.amountToman || rialToToman(t.amountRial);

                  return (
                    <tr
                      key={t.transactionId || idx}
                      className="hover:bg-slate-50/90 transition-colors bg-white font-medium"
                    >
                      {/* Row Number (#) in Persian */}
                      <td className="py-4 px-4 text-center font-bold text-slate-800 text-sm">
                        {toPersianDigits(idx + 1)}
                      </td>

                      {/* Customer Name */}
                      <td className="py-4 px-4 text-slate-900 font-bold text-sm">
                        {t.customerName}
                      </td>

                      {/* National ID */}
                      <td className="py-4 px-4 text-center text-slate-800 font-semibold text-sm">
                        {toPersianDigits(t.nationalId || '')}
                      </td>

                      {/* Mobile */}
                      <td className="py-4 px-4 text-center text-slate-800 font-semibold text-sm">
                        {toPersianDigits(t.phone || '')}
                      </td>

                      {/* Deposit Amount (مبلغ واریزی) */}
                      <td className="py-4 px-4 text-center font-bold text-slate-900 text-sm">
                        {formatAmount(displayAmount)}
                      </td>

                      {/* Bank Gateway: Sep Logo */}
                      <td className="py-4 px-4 text-center">
                        <SepBankLogo />
                      </td>

                      {/* Deposit Date & Time (تاریخ واریز) */}
                      <td className="py-4 px-4 text-center text-slate-900 font-bold text-sm">
                        {toPersianDigits(t.paymentDate)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Search Modal matching Annotation 2026-09-29 120227.png */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#242f42] rounded-xl shadow-2xl max-w-2xl w-full border border-[#354562] overflow-hidden text-right text-white animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 px-6 flex items-center justify-between border-b border-[#303e58]">
              {/* Close Button on Left */}
              <button
                onClick={() => setIsSearchModalOpen(false)}
                className="w-8 h-8 rounded-md bg-[#38465f] hover:bg-[#455574] text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="بستن"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* Title on Right */}
              <h2 className="text-lg font-bold text-white tracking-wide">
                جستجو
              </h2>
            </div>

            {/* Modal Form Body matching Screenshot */}
            <div className="p-6 space-y-5">
              {/* Row 1: نام و نام خانوادگی | موبایل | کد ملی */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Field 1: نام و نام خانوادگی */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium block">
                    نام و نام خانوادگی
                  </label>
                  <input
                    type="text"
                    value={filterCustomerName}
                    onChange={(e) => setFilterCustomerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#1f2838] border border-[#3b4b68] rounded-md text-white focus:outline-hidden focus:border-[#00acc1] transition-colors"
                  />
                </div>

                {/* Field 2: موبایل */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium block">
                    موبایل
                  </label>
                  <input
                    type="text"
                    value={filterPhone}
                    onChange={(e) => setFilterPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#1f2838] border border-[#3b4b68] rounded-md text-white focus:outline-hidden focus:border-[#00acc1] transition-colors"
                  />
                </div>

                {/* Field 3: کد ملی */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium block">
                    کد ملی
                  </label>
                  <input
                    type="text"
                    value={filterNationalId}
                    onChange={(e) => setFilterNationalId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#1f2838] border border-[#3b4b68] rounded-md text-white focus:outline-hidden focus:border-[#00acc1] transition-colors"
                  />
                </div>
              </div>

              {/* Row 2: اسپانسر | از تاریخ | تا تاریخ */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Field 1: اسپانسر (Dropdown) */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium block">
                    اسپانسر
                  </label>
                  <select
                    value={filterSponsor}
                    onChange={(e) => setFilterSponsor(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#1f2838] border border-[#3b4b68] rounded-md text-white focus:outline-hidden focus:border-[#00acc1] transition-colors cursor-pointer"
                  >
                    <option value="همه">همه</option>
                    <option value="اسپانسر بقولی فرد">اسپانسر بقولی فرد</option>
                  </select>
                </div>

                {/* Field 2: از تاریخ */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium block">
                    از تاریخ
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: ۱۴۰۵-۰۷-۰۱"
                    value={filterFromDate}
                    onChange={(e) => setFilterFromDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#1f2838] border border-[#3b4b68] rounded-md text-white focus:outline-hidden focus:border-[#00acc1] transition-colors"
                  />
                </div>

                {/* Field 3: تا تاریخ */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium block">
                    تا تاریخ
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: ۱۴۰۵-۰۷-۰۷"
                    value={filterToDate}
                    onChange={(e) => setFilterToDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#1f2838] border border-[#3b4b68] rounded-md text-white focus:outline-hidden focus:border-[#00acc1] transition-colors"
                  />
                </div>
              </div>

              {/* Modal Actions Footer matching Screenshot */}
              <div className="pt-4 flex items-center justify-between border-t border-[#303e58]">
                {/* Left Action Buttons: Download + Search */}
                <div className="flex items-center gap-2">
                  {/* Cyan Download Button */}
                  <button
                    onClick={handleExportCSV}
                    className="w-12 h-10 bg-[#00bcd4] hover:bg-[#00acc1] text-white rounded-md flex items-center justify-center transition-colors cursor-pointer shadow-xs active:scale-95"
                    title="دانلود فایل خروجی"
                  >
                    <Download className="w-5 h-5 text-white stroke-[2.5]" />
                  </button>

                  {/* Green Search Submit Button */}
                  <button
                    onClick={handleApplySearch}
                    className="w-12 h-10 bg-[#20c997] hover:bg-[#1db386] text-white rounded-md flex items-center justify-center transition-colors cursor-pointer shadow-xs active:scale-95"
                    title="اعمال جستجو"
                  >
                    <Search className="w-5 h-5 text-white stroke-[2.5]" />
                  </button>
                </div>

                {/* Right: بستن (Close) Button */}
                <div className="flex items-center gap-2">
                  {(appliedFilters.customerName || appliedFilters.phone || appliedFilters.nationalId || appliedFilters.fromDate || appliedFilters.toDate) && (
                    <button
                      onClick={handleResetFilters}
                      className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      حذف فیلترها
                    </button>
                  )}
                  <button
                    onClick={() => setIsSearchModalOpen(false)}
                    className="px-6 py-2 bg-[#524a48] hover:bg-[#605754] text-white text-sm font-semibold rounded-md transition-colors cursor-pointer shadow-xs"
                  >
                    بستن
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
