import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-[#182132] border-b border-[#253249] sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Parkway Kala Logo & Tool Name Only */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center text-white font-black text-xl shadow-xs tracking-tight">
            PW
          </div>
          <span className="font-extrabold text-white text-lg tracking-tight">
            ابزار پارک‌وی کالا
          </span>
        </div>
      </div>
    </header>
  );
};
