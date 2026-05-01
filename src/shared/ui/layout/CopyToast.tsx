import React from 'react';
import { Check } from 'lucide-react';

interface CopyToastProps {
  show: boolean;
}

export function CopyToast({ show }: CopyToastProps) {
  if (!show) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 backdrop-blur-md">
        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
        <p className="text-sm font-bold tracking-wide">クリップボードにコピーしました</p>
      </div>
    </div>
  );
}
