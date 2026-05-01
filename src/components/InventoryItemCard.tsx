import React from 'react';
import { InventoryItem } from '../types';
import { Trash2, Settings2, Calendar, Copy, FileText } from 'lucide-react';
import { getItemAlertState } from '../lib/alerts';
import { ItemBadges } from './InventoryItemCard/ItemBadges';
import { PriceInfo } from './InventoryItemCard/PriceInfo';
import { UsageGauge } from './InventoryItemCard/UsageGauge';
import { StockControls } from './InventoryItemCard/StockControls';

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
  onUpdateRemaining,
}) => {
  const { isPercentAlert, expiryStatus, isAlert } = getItemAlertState(item);

  return (
    <div className="group relative bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 hover:border-violet-100 transition-all duration-500 flex flex-col min-h-[220px]">
      
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

      <PriceInfo 
        currentPricePerUnit={item.pricePerUnit ?? item.purchasePrice}
        lowestPricePerUnit={item.lowestPricePerUnit}
        contentAmount={item.contentAmount}
        contentUnit={item.contentUnit}
        unit={item.unit}
        priceHistory={item.priceHistory}
      />

      <ItemBadges 
        isOpened={!!item.isOpened}
        isArchived={!!item.isArchived}
        isAlert={isAlert}
        isPercentAlert={isPercentAlert}
        isHistoryView={item.isHistoryView}
        onUnopen={onUnopen ? () => onUnopen(item.id) : undefined}
      />

      {item.notes && !item.isArchived && (
        <div className="mb-6 px-4 py-3 bg-gray-50/50 rounded-2xl border border-gray-100/50 flex items-start gap-2.5">
          <FileText className="w-3.5 h-3.5 text-gray-300 mt-0.5 shrink-0" />
          <p className="text-[11px] leading-relaxed text-gray-500 font-medium break-words">
            {item.notes}
          </p>
        </div>
      )}

      {item.isOpened && !item.isArchived && onUpdateRemaining && (
        <UsageGauge 
          remainingPercent={item.remainingPercent ?? 100}
          alertThresholdPercent={item.alertThresholdPercent ?? 20}
          onUpdateRemaining={(amount) => onUpdateRemaining(item.id, amount)}
        />
      )}

      <StockControls 
        id={item.id}
        stock={item.stock}
        unit={item.unit}
        isOpened={!!item.isOpened}
        isArchived={!!item.isArchived}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        onOpen={onOpen}
        onArchive={onArchive}
      />

      {item.isArchived && (
        <div className="mt-2 text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2 text-right">
          {item.archivedAt && new Date(item.archivedAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};
