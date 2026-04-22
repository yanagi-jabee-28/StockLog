import React from 'react';
import { InventoryItem } from '../types';
import { Minus, Plus, Trash2, BoxSelect, Settings2, Archive, RotateCcw, Calendar, Copy, FileText } from 'lucide-react';
import { getItemAlertState } from '../lib/alerts';
import { formatCurrency } from '../lib/price';

interface InventoryItemCardProps {
  item: InventoryItem;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onDelete: (id: string) => void;
  onOpen?: (id: string) => void;
  onUnopen?: (id: string) => void;
  onEdit?: (item: InventoryItem) => void;
  onDuplicate?: (item: InventoryItem) => void;
  onArchive?: (id: string) => void;
  onUpdateRemaining?: (id: string, amount: string) => void;
}

export const InventoryItemCard: React.FC<InventoryItemCardProps> = ({ 
  item, 
  onIncrement, 
  onDecrement, 
  onDelete, 
  onOpen, 
  onUnopen, 
  onEdit, 
  onDuplicate,
  onArchive, 
  onUpdateRemaining 
}) => {
  const { isPercentAlert, expiryStatus, isAlert } = getItemAlertState(item);
  const priceHistory = item.priceHistory ?? [];
  const currentPricePerUnit = item.pricePerUnit ?? item.purchasePrice;
  const lowestPricePerUnit = item.lowestPricePerUnit ?? currentPricePerUnit;
  const hasPriceInfo = currentPricePerUnit !== undefined || priceHistory.length > 0;

  const handlePercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdateRemaining) {
      const val = parseInt(e.target.value);
      onUpdateRemaining(item.id, val.toString()); // Passing as string for generic compatibility
    }
  };

  return (
    <div className="group relative bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 hover:border-violet-100 transition-all duration-500 flex flex-col min-h-[220px]">
      
      {/* Header Section: Title & Action Buttons */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 pr-4">
          <h3 className="font-black text-xl text-gray-900 tracking-tight leading-tight truncate">
            {item.name}
          </h3>
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                {item.unit}
              </span>
              <span className="text-[9px] font-bold text-gray-300 uppercase tracking-wider">
                {item.alertThreshold}{item.unit} / {item.alertThresholdPercent ?? 20}%
              </span>
            </div>
            {expiryStatus && (
              <div className={`flex items-center gap-1.5 text-[10px] font-bold ${expiryStatus.color}`}>
                <Calendar className="w-3 h-3" />
                <span>{expiryStatus.label}</span>
                <span className="text-[9px] opacity-60 font-medium">({item.expiryDate})</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          {!item.isOpened && !item.isArchived && onDuplicate && (
            <button 
              onClick={() => onDuplicate(item)}
              className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
              title="別ロットを追加 (複製)"
              aria-label="複製"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={() => onEdit?.(item)}
            className="p-2 text-gray-300 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
            aria-label="編集"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(item.id)}
            className="p-2 text-gray-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
            aria-label="削除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {hasPriceInfo && (
        <div className="mb-6 rounded-2xl border border-violet-100 bg-violet-50/60 p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {currentPricePerUnit !== undefined && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-white text-violet-700 text-[10px] font-black border border-violet-100 uppercase tracking-wider">
                単価 ¥{formatCurrency(currentPricePerUnit)}{item.contentUnit ? ` / ${item.contentUnit}` : ''}
              </span>
            )}
            {lowestPricePerUnit !== undefined && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-[10px] font-black border border-violet-200 uppercase tracking-wider">
                最安 ¥{formatCurrency(lowestPricePerUnit)}
              </span>
            )}
            {item.contentAmount !== undefined && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-white text-gray-500 text-[10px] font-bold border border-gray-100 uppercase tracking-wider">
                {item.contentAmount}{item.contentUnit || item.unit}
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
      )}

      {/* Badges Section: Stacked below title to prevent overlap */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {item.isOpened && (
          <>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-white text-[10px] font-black rounded-full shadow-lg shadow-amber-100 border border-amber-500 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              USING
            </span>
            {!item.isArchived && onUnopen && (
              <button 
                onClick={() => onUnopen(item.id)}
                className="flex items-center gap-1 text-[8px] font-bold text-gray-300 hover:text-gray-500 transition-colors uppercase tracking-widest pl-1"
                title="開封を取り消してストックに戻す"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                開封を取消
              </button>
            )}
          </>
        )}
        {isAlert && !item.isArchived && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500 text-white text-[10px] font-black rounded-full shadow-lg shadow-rose-100 border border-rose-600 whitespace-nowrap animate-bounce">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            {isPercentAlert ? 'ALMOST EMPTY' : 'LOW STOCK'}
          </span>
        )}
        {item.isArchived && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-black rounded-full border border-gray-200 whitespace-nowrap uppercase tracking-widest">
            COMPLETED
          </span>
        )}
        {!item.isArchived && (item as any).isHistoryView && (
           <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 text-violet-600 text-[10px] font-black rounded-full border border-violet-100 whitespace-nowrap uppercase tracking-widest">
            IN STOCK
          </span>
        )}
      </div>

      {item.notes && !item.isArchived && (
        <div className="mb-6 px-4 py-3 bg-gray-50/50 rounded-2xl border border-gray-100/50 flex items-start gap-2.5">
          <FileText className="w-3.5 h-3.5 text-gray-300 mt-0.5 shrink-0" />
          <p className="text-[11px] leading-relaxed text-gray-500 font-medium break-words">
            {item.notes}
          </p>
        </div>
      )}

      {/* Opened state: Gauge Slider */}
      {item.isOpened && !item.isArchived && onUpdateRemaining && (
        <div className="mb-8">
          <div className="flex justify-between items-end mb-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Remaining Amount</p>
            <span className="text-xl font-mono font-black text-amber-600 leading-none">
              {item.remainingPercent ?? 100}<span className="text-[10px] ml-0.5">%</span>
            </span>
          </div>
          
          <div className="relative h-4 bg-gray-50 rounded-full border border-gray-100 overflow-hidden group/gauge">
            {/* Background progress bar */}
            <div 
              className={`absolute inset-y-0 left-0 transition-all duration-300 ${
                (item.remainingPercent ?? 100) <= (item.alertThresholdPercent ?? 20) ? 'bg-rose-500' : 'bg-amber-400'
              }`}
              style={{ width: `${item.remainingPercent ?? 100}%` }}
            />
            {/* Invisible Range Slider for interaction */}
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={item.remainingPercent ?? 100}
              onChange={handlePercentChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
          </div>
          <div className="flex justify-between mt-1 px-1">
            <span className="text-[8px] font-bold text-gray-300 uppercase">Empty</span>
            <span className="text-[8px] font-bold text-gray-300 uppercase">Full</span>
          </div>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">Stock</span>
          <div className="flex items-baseline gap-1">
            <span className={`text-4xl font-mono font-bold tracking-tighter ${isAlert ? 'text-rose-600' : 'text-gray-900'}`}>
              {item.stock}
            </span>
            <span className="text-xs font-bold text-gray-400">{item.unit}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {item.stock > 0 && !item.isOpened && !item.isArchived && onOpen && (
            <button
              onClick={() => onOpen(item.id)}
              className="mr-2 flex items-center gap-1.5 justify-center px-3 py-2.5 bg-violet-50 text-violet-600 hover:bg-violet-100 rounded-xl transition-all"
              title="1つ開封する"
            >
              <BoxSelect className="w-5 h-5" />
              <span className="text-[10px] font-black tracking-wider uppercase">1つ開封</span>
            </button>
          )}

          {item.isOpened && !item.isArchived && onArchive && (
             <button
              onClick={() => onArchive(item.id)}
              className="mr-2 flex items-center justify-center p-2.5 bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              title="ログに保存"
            >
              <Archive className="w-5 h-5" />
            </button>
          )}

          {!item.isArchived && !item.isOpened && (
            <div className="flex items-center gap-3 p-1 bg-gray-50 rounded-[2rem] border border-gray-100">
              <button
                onClick={() => onDecrement(item.id)}
                disabled={item.stock <= 0}
                className={`w-12 h-12 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all ${
                  item.stock > 0 
                    ? 'bg-white text-gray-700 shadow-sm hover:text-rose-600 active:scale-95' 
                    : 'text-gray-300 cursor-not-allowed'
                }`}
                aria-label="消費"
              >
                <Minus className="w-5 h-5 md:w-4 md:h-4" strokeWidth={3} />
              </button>
              <button
                onClick={() => onIncrement(item.id)}
                className="w-12 h-12 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-gray-900 text-white shadow-xl shadow-gray-200 hover:bg-black active:scale-95 transition-all"
                aria-label="追加"
              >
                <Plus className="w-5 h-5 md:w-4 md:h-4" strokeWidth={3} />
              </button>
            </div>
          )}

          {item.isArchived && (
            <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2">
              {item.archivedAt && new Date(item.archivedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
