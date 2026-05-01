import React from 'react';
import { formatCurrency } from '../../../../shared/lib/price';
import { PriceHistoryEntry } from '../../../../shared/types';

interface PriceInfoProps {
  currentPricePerUnit?: number;
  lowestPricePerUnit?: number;
  contentAmount?: number;
  contentUnit?: string;
  unit: string;
  priceHistory?: PriceHistoryEntry[];
}

export function PriceInfo({
  currentPricePerUnit,
  lowestPricePerUnit,
  contentAmount,
  contentUnit,
  unit,
  priceHistory = [],
}: PriceInfoProps) {
  const hasPriceInfo = currentPricePerUnit !== undefined || priceHistory.length > 0;

  if (!hasPriceInfo) return null;

  return (
    <div className="mb-6 rounded-2xl border border-violet-100 bg-violet-50/60 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {currentPricePerUnit !== undefined && (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-white text-violet-700 text-[10px] font-black border border-violet-100 uppercase tracking-wider">
            単価 ¥{formatCurrency(currentPricePerUnit)}{contentUnit ? ` / ${contentUnit}` : ''}
          </span>
        )}
        {lowestPricePerUnit !== undefined && (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-[10px] font-black border border-violet-200 uppercase tracking-wider">
            最安 ¥{formatCurrency(lowestPricePerUnit)}
          </span>
        )}
        {contentAmount !== undefined && (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-white text-gray-500 text-[10px] font-bold border border-gray-100 uppercase tracking-wider">
            {contentAmount}{contentUnit || unit}
          </span>
        )}
      </div>

      {priceHistory.length > 0 && (
        <details className="group/price">
          <summary className="cursor-pointer list-none text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-violet-600 transition-colors">
            価格履歴 {priceHistory.length > 1 ? `(${priceHistory.length})` : ''}
          </summary>
          <div className="mt-3 space-y-2">
            {priceHistory.slice(0, 5).map((entry) => (
              <div key={`${entry.timestamp}-${entry.pricePerUnit}`} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 border border-violet-100">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400">
                    {new Date(entry.timestamp).toLocaleDateString('ja-JP')}
                  </p>
                  <p className="text-xs font-black text-gray-700 truncate">
                    ¥{formatCurrency(entry.purchasePrice)}
                    {entry.contentAmount !== undefined && entry.contentUnit ? ` / ${entry.contentAmount}${entry.contentUnit}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-black text-violet-600 uppercase tracking-wider">
                    単価 ¥{formatCurrency(entry.pricePerUnit)}
                  </p>
                  {entry.notes && (
                    <p className="text-[10px] text-gray-400 max-w-[140px] truncate">{entry.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
