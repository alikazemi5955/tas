import React, { useState, useMemo } from 'react';
import { Eye, Download, RefreshCw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckCircle2 } from 'lucide-react';
import { SettledCase } from '../types';
import { toPersianDigits } from '../utils/formatters';

interface SettledCasesViewProps {
  cases: SettledCase[];
  onSelectCase: (c: SettledCase) => void;
  onDownloadSlip?: (c: SettledCase) => void;
  onPreviewCard?: (c: SettledCase) => void;
  onReprocessCase?: (caseId: string) => void;
  onRunBatch?: () => void;
  onDownloadZip?: () => void;
  isBusy?: boolean;
  onRefreshData?: () => Promise<void>;
}

export const SettledCasesView: React.FC<SettledCasesViewProps> = ({
  cases,
  onSelectCase,
  onDownloadSlip,
  onRefreshData,
  isBusy,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [sortField, setSortField] = useState<'id' | 'caseNumber' | 'shopName' | 'sponsor' | 'settlementDateTime'>('settlementDateTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Live Sync trigger with Parkway Kala admin
  const handleLiveSync = async () => {
    try {
      setIsSyncing(true);
      setSyncMessage('در حال اتصال به admin.parkwaykala.ir...');
      const res = await fetch('/api/cases/sync-live', { method: 'POST' }).then(r => r.json());
      if (res.success) {
        setSyncMessage(`✓ همگام‌سازی موفق: ${toPersianDigits(res.count)} پرونده از پنل دریافت شد`);
        if (onRefreshData) {
          await onRefreshData();
        }
      } else {
        setSyncMessage(`خطا: ${res.error}`);
      }
    } catch (e: any) {
      setSyncMessage('خطا در برقراری ارتباط با سرور');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  // 1. Filter cases by search term
  const filteredCases = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return cases;

    return cases.filter((c) => {
      return (
        c.customerName.toLowerCase().includes(term) ||
        c.caseId.includes(term) ||
        (c.caseNumber && c.caseNumber.includes(term)) ||
        (c.shopName && c.shopName.toLowerCase().includes(term)) ||
        (c.sponsor && c.sponsor.toLowerCase().includes(term)) ||
        (c.nationalId && c.nationalId.includes(term))
      );
    });
  }, [cases, searchTerm]);

  // 2. Sort cases according to sortField & sortOrder (default: settlementDateTime descending)
  const sortedCases = useMemo(() => {
    const list = [...filteredCases];
    list.sort((a, b) => {
      let valA = '';
      let valB = '';

      if (sortField === 'id') {
        const numA = parseInt(a.caseId, 10) || 0;
        const numB = parseInt(b.caseId, 10) || 0;
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      } else if (sortField === 'caseNumber') {
        const numA = parseInt(a.caseNumber || '0', 10) || 0;
        const numB = parseInt(b.caseNumber || '0', 10) || 0;
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      } else if (sortField === 'shopName') {
        valA = a.shopName || '';
        valB = b.shopName || '';
      } else if (sortField === 'sponsor') {
        valA = a.sponsor || '';
        valB = b.sponsor || '';
      } else {
        // settlementDateTime (latest paid installment)
        valA = a.settlementDateTime || a.settlementDate || '';
        valB = b.settlementDateTime || b.settlementDate || '';
      }

      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
    return list;
  }, [filteredCases, sortField, sortOrder]);

  // 3. Paginate
  const totalRows = sortedCases.length;
  const totalPages = Math.ceil(totalRows / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const paginatedCases = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return sortedCases.slice(startIndex, startIndex + pageSize);
  }, [sortedCases, safeCurrentPage, pageSize]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const startIndex = totalRows === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(safeCurrentPage * pageSize, totalRows);

  return (
    <div className="space-y-4 font-sans text-right select-none" dir="rtl">
      {/* Title & Live Sync Header matching Parkway Kala Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white tracking-wide">
            پرونده های تسویه شده
          </h1>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#1d2b45] text-sky-300 border border-[#2b4169]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>متصل به سامانه مدیریت (admin.parkwaykala.ir)</span>
          </span>
        </div>

        {/* Sync Button & Feedback */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {syncMessage && (
            <span className="text-xs text-emerald-400 font-medium animate-fadeIn">
              {syncMessage}
            </span>
          )}
          <button
            onClick={handleLiveSync}
            disabled={isSyncing || isBusy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#25324d] hover:bg-[#314264] text-slate-200 hover:text-white border border-[#37486d] text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            title="دریافت لحظه‌ای پرونده‌های جدید تسویه شده از پنل مدیریت"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : 'text-slate-300'}`} />
            <span>همگام‌سازی زنده با پنل</span>
          </button>
        </div>
      </div>

      {/* Bootstrap-Table Filter & Search Toolbar (Exactly matching admin.parkwaykala.ir) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#20293d] p-3 rounded-t-lg border-t border-x border-[#2b374e]">
        {/* Page Size Dropdown */}
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span>نمایش</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-[#192233] border border-[#33415c] rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-hidden focus:border-[#4f6285] cursor-pointer"
          >
            <option value={15}>۱۵</option>
            <option value={30}>۳۰</option>
            <option value={50}>۵۰</option>
            <option value={100}>۱۰۰</option>
          </select>
          <span>رکورد در هر صفحه</span>
        </div>

        {/* Search Input */}
        <div className="flex items-center">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search"
            className="w-48 sm:w-60 px-3.5 py-1.5 text-xs text-slate-200 placeholder-slate-400 bg-[#192233] border border-[#33415c] rounded-md focus:outline-hidden focus:border-[#4f6285] transition-colors text-right"
          />
        </div>
      </div>

      {/* Dark Table matching Parkway Kala Admin theme 1-to-1 */}
      <div className="border border-[#2b374e] bg-[#20293d] overflow-hidden shadow-xl rounded-b-lg -mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse" id="loans">
            <thead>
              <tr className="bg-[#212b40] text-slate-300 font-semibold border-b border-[#2b374e]">
                {/* ID Column */}
                <th
                  onClick={() => toggleSort('id')}
                  className="py-3 px-4 text-center border-l border-[#2b374e] w-20 cursor-pointer hover:bg-[#28354f] transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>ID</span>
                    <span className="text-[10px] text-slate-400">
                      {sortField === 'id' ? (sortOrder === 'asc' ? '▲' : '▼') : '▲▼'}
                    </span>
                  </div>
                </th>

                {/* Customer Name */}
                <th className="py-3 px-5 border-l border-[#2b374e]">
                  <span>نام کاربر</span>
                </th>

                {/* Case Number */}
                <th
                  onClick={() => toggleSort('caseNumber')}
                  className="py-3 px-4 text-center border-l border-[#2b374e] cursor-pointer hover:bg-[#28354f] transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>شماره پرونده</span>
                    <span className="text-[10px] text-slate-400">
                      {sortField === 'caseNumber' ? (sortOrder === 'asc' ? '▲' : '▼') : '▲▼'}
                    </span>
                  </div>
                </th>

                {/* Shop Name */}
                <th
                  onClick={() => toggleSort('shopName')}
                  className="py-3 px-4 text-center border-l border-[#2b374e] cursor-pointer hover:bg-[#28354f] transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>نام فروشگاه</span>
                    <span className="text-[10px] text-slate-400">
                      {sortField === 'shopName' ? (sortOrder === 'asc' ? '▲' : '▼') : '▲▼'}
                    </span>
                  </div>
                </th>

                {/* Sponsor */}
                <th
                  onClick={() => toggleSort('sponsor')}
                  className="py-3 px-4 text-center border-l border-[#2b374e] cursor-pointer hover:bg-[#28354f] transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>اسپانسر</span>
                    <span className="text-[10px] text-slate-400">
                      {sortField === 'sponsor' ? (sortOrder === 'asc' ? '▲' : '▼') : '▲▼'}
                    </span>
                  </div>
                </th>

                {/* Settlement Date & Time */}
                <th
                  onClick={() => toggleSort('settlementDateTime')}
                  className="py-3 px-4 text-center border-l border-[#2b374e] cursor-pointer hover:bg-[#28354f] transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>تاریخ تسویه</span>
                    <span className="text-[10px] text-amber-400 font-bold">
                      {sortField === 'settlementDateTime' ? (sortOrder === 'asc' ? '▲' : '▼') : '▲▼'}
                    </span>
                  </div>
                </th>

                {/* Action / Command (دستور) */}
                <th className="py-3 px-4 text-center w-16">
                  <span>دستور</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#2b374e] text-slate-200">
              {paginatedCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 bg-[#1e273b]">
                    هیچ پرونده‌ای یافت نشد.
                  </td>
                </tr>
              ) : (
                paginatedCases.map((c) => (
                  <tr
                    key={c.caseId}
                    className="hover:bg-[#273249] transition-colors group bg-[#20293d]"
                  >
                    {/* ID */}
                    <td className="py-3.5 px-4 text-center font-bold text-slate-200 border-l border-[#2b374e] font-sans">
                      {toPersianDigits(c.caseId)}
                    </td>

                    {/* Customer Name */}
                    <td className="py-3.5 px-5 font-medium text-slate-100 border-l border-[#2b374e]">
                      {c.customerName}
                    </td>

                    {/* Case Number */}
                    <td className="py-3.5 px-4 text-center text-slate-200 border-l border-[#2b374e] font-sans">
                      {toPersianDigits(c.caseNumber || c.caseId)}
                    </td>

                    {/* Shop Name */}
                    <td className="py-3.5 px-4 text-center text-slate-300 border-l border-[#2b374e]">
                      {c.shopName || 'پارک وی'}
                    </td>

                    {/* Sponsor */}
                    <td className="py-3.5 px-4 text-center text-slate-300 border-l border-[#2b374e]">
                      {c.sponsor || 'اسپانسر بقولی فرد'}
                    </td>

                    {/* Settlement Date & Time */}
                    <td className="py-3.5 px-4 text-center text-slate-200 border-l border-[#2b374e] font-sans">
                      {toPersianDigits(c.settlementDateTime || c.settlementDate || '')}
                    </td>

                    {/* Command: Eye Icon & Download Icon */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onSelectCase(c)}
                          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#32405d] transition-colors cursor-pointer inline-flex items-center justify-center"
                          title="مشاهده اقساط"
                          id="btn_installments"
                        >
                          <Eye className="w-4 h-4 text-slate-300 group-hover:text-white" />
                        </button>
                        <button
                          onClick={() => onDownloadSlip && onDownloadSlip(c)}
                          className="p-1.5 rounded text-emerald-400 hover:text-emerald-300 hover:bg-[#32405d] transition-colors cursor-pointer inline-flex items-center justify-center"
                          title="دانلود برگ تسویه اقساط"
                          id="btn_download_slip"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bootstrap Table Pagination Footer matching Parkway Kala */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-[#212b40] border-t border-[#2b374e] text-xs text-slate-300 gap-3">
          {/* Showing Rows Info */}
          <div>
            <span>نمایش </span>
            <span className="font-bold text-white font-sans">{toPersianDigits(startIndex)}</span>
            <span> تا </span>
            <span className="font-bold text-white font-sans">{toPersianDigits(endIndex)}</span>
            <span> از </span>
            <span className="font-bold text-white font-sans">{toPersianDigits(totalRows)}</span>
            <span> ردیف</span>
          </div>

          {/* Page Buttons */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
                className="p-1.5 rounded bg-[#1b2333] hover:bg-[#2b374e] disabled:opacity-40 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="صفحه اول"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={safeCurrentPage === 1}
                className="p-1.5 rounded bg-[#1b2333] hover:bg-[#2b374e] disabled:opacity-40 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="صفحه قبل"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Page Number Pills */}
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 7) {
                  if (safeCurrentPage > 4 && safeCurrentPage < totalPages - 3) {
                    pageNum = safeCurrentPage - 3 + i;
                  } else if (safeCurrentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  }
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-7 h-7 px-2 flex items-center justify-center rounded text-xs font-semibold transition-colors cursor-pointer ${
                      safeCurrentPage === pageNum
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-[#1b2333] text-slate-300 hover:bg-[#2b374e] hover:text-white'
                    }`}
                  >
                    {toPersianDigits(pageNum)}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={safeCurrentPage === totalPages}
                className="p-1.5 rounded bg-[#1b2333] hover:bg-[#2b374e] disabled:opacity-40 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="صفحه بعد"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage === totalPages}
                className="p-1.5 rounded bg-[#1b2333] hover:bg-[#2b374e] disabled:opacity-40 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="صفحه آخر"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
