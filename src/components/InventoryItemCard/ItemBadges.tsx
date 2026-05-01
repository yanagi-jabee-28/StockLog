import React from 'react';
import { RotateCcw } from 'lucide-react';

interface ItemBadgesProps {
  isOpened: boolean;
  isArchived: boolean;
  isAlert: boolean;
  isPercentAlert: boolean;
  isHistoryView?: boolean;
  onUnopen?: () => void;
}

export function ItemBadges({
  isOpened,
  isArchived,
  isAlert,
  isPercentAlert,
  isHistoryView,
  onUnopen,
}: ItemBadgesProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {isOpened && (
        <>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-white text-[10px] font-black rounded-full shadow-lg shadow-amber-100 border border-amber-500 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            USING
          </span>
          {!isArchived && onUnopen && (
            <button 
              onClick={onUnopen}
              className="flex items-center gap-1 text-[8px] font-bold text-gray-300 hover:text-gray-500 transition-colors uppercase tracking-widest pl-1"
              title="開封を取り消してストックに戻す"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              開封を取消
            </button>
          )}
        </>
      )}
      {isAlert && !isArchived && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500 text-white text-[10px] font-black rounded-full shadow-lg shadow-rose-100 border border-rose-600 whitespace-nowrap animate-bounce">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          {isPercentAlert ? 'ALMOST EMPTY' : 'LOW STOCK'}
        </span>
      )}
      {isArchived && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-black rounded-full border border-gray-200 whitespace-nowrap uppercase tracking-widest">
          COMPLETED
        </span>
      )}
      {!isArchived && isHistoryView && (
         <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 text-violet-600 text-[10px] font-black rounded-full border border-violet-100 whitespace-nowrap uppercase tracking-widest">
          IN STOCK
        </span>
      )}
    </div>
  );
}
