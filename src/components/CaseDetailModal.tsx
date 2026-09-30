import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { SettledCase, InstallmentRecord } from '../types';
import { toPersianDigits, rialToToman } from '../utils/formatters';
import { generateCardSvg } from '../utils/cardUtils';

interface CaseDetailModalProps {
  settledCase: SettledCase | null;
  onClose: () => void;
  onReprocess?: (caseId: string) => void;
  onDownloadCard?: (c: SettledCase) => void;
  onUpdateCase?: (c: SettledCase) => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  settledCase,
  onClose,
  onDownloadCard,
  onUpdateCase,
}) => {
  const isVerified = (insts?: InstallmentRecord[]) => {
    return Boolean(
      insts &&
      insts.length > 0 &&
      insts.some(i => i.paidAmountRial !== undefined || i.penaltyAmountRial !== undefined)
    );
  };

  const initialVerified = isVerified(settledCase?.installments);
  const [installments, setInstallments] = useState<InstallmentRecord[]>(
    initialVerified ? (settledCase?.installments || []) : []
  );
  const [loading, setLoading] = useState<boolean>(!initialVerified);

  useEffect(() => {
    if (!settledCase) return;

    if (isVerified(settledCase.installments)) {
      setInstallments(settledCase.installments || []);
      setLoading(false);
      return;
    }

    let isCancelled = false;
    setLoading(true);

    const fetchLiveInstallments = async () => {
      try {
        const res = await fetch(`/api/cases/${settledCase.caseId}/live-installments`).then(r => r.json());
        if (!isCancelled && res.success && Array.isArray(res.installments) && res.installments.length > 0) {
          setInstallments(res.installments);
          if (onUpdateCase) {
            onUpdateCase({
              ...settledCase,
              installments: res.installments,
              installmentCount: res.installments.length,
              installmentAmountRial: res.installments[0]?.amountRial || settledCase.installmentAmountRial,
              installmentAmountToman: res.installments[0]?.amountToman || settledCase.installmentAmountToman
            });
          }
        }
      } catch (e) {
        console.error('Failed to fetch live installments summary:', e);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchLiveInstallments();

    return () => {
      isCancelled = true;
    };
  }, [settledCase?.caseId]);

  if (!settledCase) return null;

  const handlePrint = () => {
    window.print();
  };

  const caseNum = settledCase.caseNumber || settledCase.caseId;
  const singleInstRial = installments[0]?.amountRial || settledCase.installmentAmountRial || 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden text-right border border-slate-300">
        
        {/* Top Header matching Annotation 2026-09-29 133430.png */}
        <div className="bg-[#283144] px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-white">
          {/* Right: Title */}
          <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
            لیست اقساط پرونده شماره {toPersianDigits(caseNum)} ({settledCase.customerName})
          </h2>

          {/* Left: Buttons (بازگشت به لیست & چاپ) */}
          <div className="flex items-center gap-2.5">
            {/* Green button: دانلود کارت تسویه */}
            {onDownloadCard && (
              <button
                onClick={() => onDownloadCard({
                  ...settledCase,
                  installments,
                  installmentCount: installments.length || settledCase.installmentCount
                })}
                className="px-3.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                title="دانلود تصویر کارت تسویه"
              >
                <Download className="w-4 h-4" />
                <span>دانلود کارت</span>
              </button>
            )}

            {/* Cyan button: چاپ */}
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-md bg-[#00cfe8] hover:bg-[#00b5ca] text-white text-sm font-semibold transition-colors cursor-pointer shadow-xs"
            >
              چاپ
            </button>

            {/* Red button: بازگشت به لیست */}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-[#ff5b5c] hover:bg-[#e04f50] text-white text-sm font-semibold transition-colors cursor-pointer shadow-xs"
            >
              بازگشت به لیست
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="p-4 sm:p-6 bg-white overflow-y-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-600 gap-3">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-bold text-slate-700">در حال دریافت و اعتبارسنجی مبالغ اقساط از پنل پارک‌وی کالا...</span>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* 1. Installments Breakdown Table (لیست اقساط با ظاهر استاندارد قبلی) */}
              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse text-sm text-slate-800" dir="rtl">
                  <thead>
                    <tr className="border-b-2 border-slate-800 text-slate-900 font-bold text-sm">
                      <th className="py-3 px-3 text-center w-12 font-bold">#</th>
                      <th className="py-3 px-4 text-center font-bold">مبلغ قسط (ریال)</th>
                      <th className="py-3 px-4 text-center font-bold">مبلغ جریمه (ریال)</th>
                      <th className="py-3 px-4 text-center font-bold">مبلغ پرداختی (تومان)</th>
                      <th className="py-3 px-4 text-center font-bold">وضعیت</th>
                      <th className="py-3 px-4 text-center font-bold">زمان پرداخت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {installments.length > 0 ? (
                      installments.map((inst, idx) => {
                        const rowNum = inst.index || idx + 1;
                        const instRial = inst.amountRial || singleInstRial;
                        const penaltyRial = inst.penaltyAmountRial ?? 0;
                        const paidRial = inst.paidAmountRial || (instRial + penaltyRial);
                        const paidToman = inst.paidAmountToman || rialToToman(paidRial);

                        return (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            {/* # */}
                            <td className="py-4 px-3 text-center font-bold text-slate-900">
                              {toPersianDigits(rowNum)}
                            </td>

                            {/* مبلغ قسط */}
                            <td className="py-4 px-4 text-center font-semibold text-slate-900">
                              {toPersianDigits(instRial.toLocaleString('en-US'))}
                            </td>

                            {/* مبلغ جریمه */}
                            <td className="py-4 px-4 text-center font-semibold text-slate-800">
                              {toPersianDigits(penaltyRial.toLocaleString('en-US'))}
                            </td>

                            {/* مبلغ پرداختی به تومان */}
                            <td className="py-4 px-4 text-center font-bold text-blue-700">
                              {toPersianDigits(paidToman.toLocaleString('en-US'))} تومان
                            </td>

                            {/* وضعیت (تسویه شده) */}
                            <td className="py-4 px-4 text-center">
                              <span className="text-[#4b6584] font-semibold text-xs sm:text-sm">
                                تسویه شده
                              </span>
                            </td>

                            {/* زمان پرداخت */}
                            <td className="py-4 px-4 text-center text-slate-900 font-semibold" dir="ltr">
                              <bdi>
                                {toPersianDigits(inst.paymentDate || settledCase.settlementDateTime || '')}
                              </bdi>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          اطلاعات اقساطی یافت نشد.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 2. Designed Settlement Slip / Graphic Table (بدون باکس سورمه ای) */}
              <div className="pt-4 border-t border-slate-200 flex justify-center">
                <div
                  className="bg-white p-2 rounded-xl shadow-md border border-slate-300 max-w-full flex justify-center overflow-x-auto"
                  dangerouslySetInnerHTML={{
                    __html: generateCardSvg({
                      ...settledCase,
                      installments,
                      installmentCount: installments.length || settledCase.installmentCount
                    })
                  }}
                />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
