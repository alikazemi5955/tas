import React from 'react';
import { FileCheck, ArrowLeftRight, Settings, ExternalLink, ShieldCheck, History, Download } from 'lucide-react';
import { toPersianDigits } from '../utils/formatters';

export type ActiveTab = 'settled_cases' | 'transactions';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  casesCount: number;
  transactionsCount: number;
  onOpenSchedule: () => void;
  onOpenHistory: () => void;
  onDownloadLatestZip: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  casesCount,
  transactionsCount,
  onOpenSchedule,
  onOpenHistory,
  onDownloadLatestZip,
}) => {
  return (
    <aside className="w-64 bg-slate-900 text-slate-200 min-h-[calc(100vh-4rem)] flex flex-col justify-between shrink-0 border-l border-slate-800">
      <div className="p-4">
        {/* Navigation Sections */}
        <div className="text-[11px] font-semibold text-slate-400 mb-3 px-2">
          بخش‌های اصلی پنل
        </div>

        <nav className="space-y-1.5">
          {/* 1. Settled Cases */}
          <button
            onClick={() => onSelectTab('settled_cases')}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'settled_cases'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileCheck className="w-4 h-4" />
              <span>پرونده های تسویه شده</span>
            </div>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                activeTab === 'settled_cases'
                  ? 'bg-amber-600/30 text-slate-950'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {toPersianDigits(casesCount)}
            </span>
          </button>

          {/* 2. Transactions */}
          <button
            onClick={() => onSelectTab('transactions')}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ArrowLeftRight className="w-4 h-4" />
              <span>تراکنش ها</span>
            </div>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                activeTab === 'transactions'
                  ? 'bg-amber-600/30 text-slate-950'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {toPersianDigits(transactionsCount)}
            </span>
          </button>
        </nav>

        {/* Quick Utility Actions & Settings */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-400 mb-2 px-2">
            ابزارها و دریافت نسخه دسکتاپ
          </div>

          {/* Standalone Desktop HTML File Download */}
          <a
            href="/api/download/standalone-html"
            download="سامانه_تسویه_پارک‌وی_کالا.html"
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-700/60 transition-all cursor-pointer shadow-xs"
            title="دانلود فایل مستقل HTML برای اجرا با دابل‌کلیک در کروم با همگام‌سازی ۳۰ ثانیه‌ای"
          >
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-400" />
              <span>دانلود فایل مستقل (دسکتاپ)</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/80 text-emerald-300 font-mono">
              کروم
            </span>
          </a>

          <button
            onClick={onOpenHistory}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <span>تاریخچه پردازش‌های روزانه</span>
            </div>
          </button>

          <button
            onClick={onDownloadLatestZip}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span>دانلود فایل ZIP روزانه</span>
            </div>
          </button>
        </div>

        {/* Security & System Info Note */}
        <div className="mt-6 p-3 rounded-lg bg-slate-800/60 border border-slate-700/50 text-[11px] space-y-2">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>حفاظت امنیتی پنل</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            نسخه شبیه‌ساز کاملاً خواندنی (Read-Only) است و رمز عبور فقط سمت سرور قرار دارد.
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-400 space-y-2">
        <button
          onClick={onOpenSchedule}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-slate-800 text-slate-300 transition-colors text-right cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-3.5 h-3.5 text-amber-500" />
            <span>تنظیم زمان‌بندی روزانه</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">23:00</span>
        </button>

        <a
          href="https://admin.parkwaykala.ir/admin/loans/settled"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-2.5 py-1.5 text-[11px] text-amber-400/90 hover:text-amber-300 transition-colors bg-slate-800/50 rounded-md"
        >
          <span>مشاهده تسهیلات تسویه شده در پنل</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        <a
          href="https://admin.parkwaykala.ir"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-2.5 py-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span>صفحه اصلی پنل ادمین</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </aside>
  );
};
