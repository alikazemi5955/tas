import React, { useRef } from 'react';
import { X, Download, Share2 } from 'lucide-react';
import { SettledCase } from '../types';
import { generateSanitizedFilename } from '../utils/cardUtils';

interface CardPreviewModalProps {
  settledCase: SettledCase | null;
  onClose: () => void;
}

export const CardPreviewModal: React.FC<CardPreviewModalProps> = ({
  settledCase,
  onClose,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);

  if (!settledCase) return null;

  const standardFilename = generateSanitizedFilename(
    settledCase.customerName,
    settledCase.caseId,
    'png'
  );

  // Converts the SVG directly to a high-resolution PNG on download
  const handleDownloadPNG = () => {
    const svgUrl = `/api/cases/${settledCase.caseId}/card.svg`;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = svgUrl;

    img.onload = () => {
      const scale = 2; // 2x DPI for crisp print quality
      const canvas = document.createElement('canvas');
      const w = img.naturalWidth || img.width || 476;
      const h = img.naturalHeight || img.height || 332;
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = standardFilename;
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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col overflow-hidden text-right border border-slate-200">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">پیش‌نمایش کارت تسویه نهایی</span>
            <span className="text-xs text-amber-400 font-mono">({standardFilename})</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Viewer */}
        <div className="p-6 bg-slate-100 flex items-center justify-center overflow-auto max-h-[75vh]">
          <div className="max-w-2xl w-full bg-white p-2 rounded-xl shadow-md border border-slate-300">
            <img
              ref={imgRef}
              src={`/api/cases/${settledCase.caseId}/card.svg`}
              alt={standardFilename}
              className="w-full h-auto rounded"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            فرمت خروجی: PNG با رزولوشن بالا و نام‌گذاری استاندارد فارسی
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              بستن
            </button>
            <button
              onClick={handleDownloadPNG}
              className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>دانلود فایل PNG ({standardFilename})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
