/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { SettledCasesView } from './components/SettledCasesView';
import { TransactionsView } from './components/TransactionsView';
import { CaseDetailModal } from './components/CaseDetailModal';
import { CardPreviewModal } from './components/CardPreviewModal';
import { ExecutionHistoryModal } from './components/ExecutionHistoryModal';
import { ScheduleConfigModal } from './components/ScheduleConfigModal';
import { SettledCase, Transaction, DailyExecutionReport } from './types';
import { generateSanitizedFilename } from './utils/cardUtils';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('settled_cases');
  const [cases, setCases] = useState<SettledCase[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reports, setReports] = useState<DailyExecutionReport[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('23:00');
  
  // Modals state
  const [selectedCaseForDetail, setSelectedCaseForDetail] = useState<SettledCase | null>(null);
  const [selectedCaseForCard, setSelectedCaseForCard] = useState<SettledCase | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Fetch all data from backend API
  const refreshAllData = useCallback(async () => {
    try {
      const [casesRes, txRes, repRes, statusRes] = await Promise.all([
        fetch('/api/cases').then(r => r.json()),
        fetch('/api/transactions').then(r => r.json()),
        fetch('/api/reports').then(r => r.json()),
        fetch('/api/automation/status').then(r => r.json())
      ]);

      if (casesRes.success) setCases(casesRes.cases);
      if (txRes.success) setTransactions(txRes.transactions);
      if (repRes.success) setReports(repRes.reports);
      if (statusRes.success) {
        setIsBusy(statusRes.isBusy);
        if (statusRes.scheduler?.scheduleTime) {
          setScheduleTime(statusRes.scheduler.scheduleTime);
        }
      }
    } catch (err) {
      console.error('Error fetching data from server:', err);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Run full daily automation (Requirement 10)
  const handleRunAutomation = async () => {
    try {
      setIsBusy(true);
      showToast('فرآیند استخراج خودکار و تولید کارت‌های پرداخت آغاز شد...', 'info');
      const res = await fetch('/api/automation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceReprocess: false })
      }).then(r => r.json());

      if (res.success) {
        showToast('فرآیند خودکار با موفقیت به پایان رسید و کارت‌های جدید صادر شدند.', 'success');
        await refreshAllData();
      } else {
        showToast(res.error || 'خطا در اجرای فرآیند', 'error');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showToast(`خطای ارتباط با سرور: ${errorMsg}`, 'error');
    } finally {
      setIsBusy(false);
    }
  };

  // Reprocess a single case (Requirement 14)
  const handleReprocessCase = async (caseId: string) => {
    try {
      showToast(`در حال پردازش مجدد پرونده ${caseId}...`, 'info');
      const res = await fetch(`/api/cases/${caseId}/reprocess`, {
        method: 'POST'
      }).then(r => r.json());

      if (res.success) {
        showToast(res.message, 'success');
        await refreshAllData();
        // Update opened modal if viewing same case
        if (selectedCaseForDetail && selectedCaseForDetail.caseId === caseId) {
          setSelectedCaseForDetail(res.case);
        }
      } else {
        showToast(res.error || 'خطا در پردازش پرونده', 'error');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showToast(`خطای ارتباط با سرور: ${errorMsg}`, 'error');
    }
  };

  // Update discrepancy in transactions (Requirement 6)
  const handleUpdateDiscrepancy = async (txId: string, note: string, status?: 'MATCHED' | 'DISCREPANCY' | 'UNLINKED') => {
    try {
      const res = await fetch(`/api/transactions/${txId}/discrepancy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note, reconciliationStatus: status })
      }).then(r => r.json());

      if (res.success) {
        showToast('یادداشت و وضعیت تطبیق تراکنش با موفقیت ثبت شد.', 'success');
        await refreshAllData();
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showToast(`خطا در ثبت یادداشت: ${errorMsg}`, 'error');
    }
  };

  // Update scheduler time (Requirement 10)
  const handleSaveScheduleTime = async (newTime: string) => {
    try {
      const res = await fetch('/api/automation/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time: newTime })
      }).then(r => r.json());

      if (res.success) {
        setScheduleTime(newTime);
        showToast(res.message, 'success');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showToast(`خطا در تغییر زمان‌بندی: ${errorMsg}`, 'error');
    }
  };

  // Download Latest ZIP
  const handleDownloadLatestZip = () => {
    const latestReportWithZip = reports.find(r => r.zipFilename);
    if (latestReportWithZip?.zipFilename) {
      window.location.href = `/api/reports/download-zip/${latestReportWithZip.zipFilename}`;
    } else {
      // Trigger new zip creation or notify
      showToast('ابتدا فرآیند استخراج را اجرا کنید تا بسته ZIP روزانه تولید شود.', 'info');
    }
  };

  // Download individual PNG card with sanitized filename (Requirement 9)
  const handleDownloadCard = (c: SettledCase) => {
    const filename = generateSanitizedFilename(c.customerName, c.caseId, 'png');
    const svgUrl = `/api/cases/${c.caseId}/card.svg`;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = svgUrl;

    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth * scale || 1440;
      canvas.height = img.naturalHeight * scale || 1000;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        }, 'image/png');
      }
    };
  };

  return (
    <div className="min-h-screen bg-[#131b29] flex flex-col font-['Vazirmatn',system-ui,sans-serif] text-slate-100" dir="rtl">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 left-5 z-50 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-800 text-white border-emerald-900'
              : toast.type === 'error'
              ? 'bg-rose-800 text-white border-rose-900'
              : 'bg-slate-900 text-white border-slate-950'
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Top Header - Logo and brand */}
      <Header />

      {/* Body: Sidebar + Main Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto bg-[#182132]">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          casesCount={cases.length}
          transactionsCount={transactions.length}
          onOpenSchedule={() => setIsScheduleOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onDownloadLatestZip={handleDownloadLatestZip}
        />

        <main className="flex-1 p-6 overflow-y-auto bg-[#182132]">
          {activeTab === 'settled_cases' ? (
            <SettledCasesView
              cases={cases}
              onSelectCase={setSelectedCaseForDetail}
              onDownloadSlip={handleDownloadCard}
              onPreviewCard={setSelectedCaseForCard}
              onReprocessCase={handleReprocessCase}
              onRunBatch={handleRunAutomation}
              onDownloadZip={handleDownloadLatestZip}
              isBusy={isBusy}
              onRefreshData={refreshAllData}
            />
          ) : (
            <TransactionsView
              transactions={transactions}
              onUpdateDiscrepancy={handleUpdateDiscrepancy}
              onFilterByCase={(caseId) => {
                // Quick jump to cases tab if needed
                setActiveTab('settled_cases');
              }}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <CaseDetailModal
        settledCase={selectedCaseForDetail}
        onClose={() => setSelectedCaseForDetail(null)}
        onReprocess={handleReprocessCase}
        onDownloadCard={handleDownloadCard}
        onUpdateCase={(updatedCase) => {
          setCases(prev => prev.map(c => c.caseId === updatedCase.caseId ? updatedCase : c));
          setSelectedCaseForDetail(updatedCase);
        }}
      />

      <CardPreviewModal
        settledCase={selectedCaseForCard}
        onClose={() => setSelectedCaseForCard(null)}
      />

      <ExecutionHistoryModal
        reports={reports}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      <ScheduleConfigModal
        currentTime={scheduleTime}
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onSaveTime={handleSaveScheduleTime}
      />
    </div>
  );
}
