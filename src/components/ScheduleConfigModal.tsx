import React, { useState } from 'react';
import { X, Clock, Check, Shield } from 'lucide-react';
import { toPersianDigits } from '../utils/formatters';

interface ScheduleConfigModalProps {
  currentTime: string;
  isOpen: boolean;
  onClose: () => void;
  onSaveTime: (newTime: string) => void;
}

export const ScheduleConfigModal: React.FC<ScheduleConfigModalProps> = ({
  currentTime,
  isOpen,
  onClose,
  onSaveTime,
}) => {
  const [selectedTime, setSelectedTime] = useState(currentTime || '23:00');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveTime(selectedTime);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 text-right space-y-4 border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-sm">تنظیم ساعت اجرای خودکار روزانه</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3 text-xs text-slate-600">
          <p className="leading-relaxed">
            فرآیند خودکارسازی هر شب در ساعت مشخص شده، وارد پنل پارک‌وی کالا شده و پرونده‌های تسویه شده جدید را استخراج و برای آن‌ها تصویر کارت پرداخت تولید می‌نماید.
          </p>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
            <div className="font-semibold text-amber-900">ساعت اجرای روزانه:</div>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-sm font-mono font-bold text-slate-900 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <div className="text-[11px] text-slate-500 space-y-1">
            <div>منطقه زمانی سرور: <strong>Asia/Tehran (به وقت ایران)</strong></div>
            <div>زمان‌بندی فعلی: ساعت {toPersianDigits(currentTime)} هر شب</div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-2 text-[11px] text-slate-600">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>رمز عبور و فرآیند در سمت سرور به صورت محافظت شده ذخیره شده‌اند.</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            انصراف
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>ذخیره شد!</span>
              </>
            ) : (
              <span>ذخیره زمان‌بندی</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
