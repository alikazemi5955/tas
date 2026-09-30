import React, { useState } from 'react';
import { X, Download, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { DailyExecutionReport } from '../types';
import { toPersianDigits } from '../utils/formatters';

interface ExecutionHistoryModalProps {
  reports: DailyExecutionReport[];
  isOpen: boolean;
  onClose: () => void;
}

export const ExecutionHistoryModal: React.FC<ExecutionHistoryModalProps> = ({
  reports,
  isOpen,
  onClose,
}) => {
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden text-right border border-slate-200">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <h2 className="font-bold text-sm">تاریخچه پردازش‌های خودکار روزانه</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Execution Records */}
        <div className="p-5 overflow-y-auto space-y-3">
          {reports.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              هنوز هیچ گزارش پردازش خودکاری ثبت نشده است.
            </div>
          ) : (
            reports.map((rep) => {
              const isExpanded = expandedReportId === rep.id;
              const isSuccess = rep.status === 'SUCCESS';

              return (
                <div
                  key={rep.id}
                  className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 hover:border-slate-300 transition-colors"
                >
                  {/* Summary Row */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" />
                            موفق
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3" />
                            دارای خطا ({toPersianDigits(rep.errorsCount)})
                          </span>
                        )}
                        <span className="font-bold text-slate-900 text-xs">
                          اجرای تاریخ {toPersianDigits(rep.runDate)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>زمان شروع: {toPersianDigits(rep.startTime)}</span>
                        <span>·</span>
                        <span>پایان: {toPersianDigits(rep.endTime)}</span>
                      </div>
                    </div>

                    {/* Stats pills */}
                    <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                      <div>
                        اسکن شده: <strong className="text-slate-900">{toPersianDigits(rep.totalCasesScanned)}</strong>
                      </div>
                      <div>
                        جدید: <strong className="text-amber-700">{toPersianDigits(rep.newCasesFound)}</strong>
                      </div>
                      <div>
                        تصاویر: <strong className="text-blue-700">{toPersianDigits(rep.imagesGenerated)}</strong>
                      </div>

                      {/* Download ZIP link */}
                      {rep.zipDownloadUrl && (
                        <a
                          href={rep.zipDownloadUrl}
                          className="px-2.5 py-1 text-[11px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded transition-colors flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>دانلود ZIP</span>
                        </a>
                      )}

                      {/* Toggle logs */}
                      <button
                        onClick={() => setExpandedReportId(isExpanded ? null : rep.id)}
                        className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="نمایش لاگ‌ها"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Logs */}
                  {isExpanded && rep.logs && (
                    <div className="p-3 bg-slate-900 text-slate-300 font-mono text-[11px] space-y-1 border-t border-slate-200 max-h-48 overflow-y-auto">
                      {rep.logs.map((logLine, lIdx) => (
                        <div key={lIdx} className="leading-relaxed">
                          {logLine}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            بستن
          </button>
        </div>

      </div>
    </div>
  );
};
