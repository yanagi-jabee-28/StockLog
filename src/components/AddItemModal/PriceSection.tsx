import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { UNIT_GROUPS } from '../../constants';

interface PriceSectionProps {
  purchasePrice: string;
  onPurchasePriceChange: (val: string) => void;
  contentAmount: string;
  onContentAmountChange: (val: string) => void;
  contentUnit: string;
  onUnitPickerOpen: () => void;
  unitPrice: number | null;
  onStartContentAmountAdjust: (delta: number) => void;
  onStopContentAmountAdjust: () => void;
}

export function PriceSection({
  purchasePrice,
  onPurchasePriceChange,
  contentAmount,
  onContentAmountChange,
  contentUnit,
  onUnitPickerOpen,
  unitPrice,
  onStartContentAmountAdjust,
  onStopContentAmountAdjust,
}: PriceSectionProps) {
  const selectedContentUnitGroup = UNIT_GROUPS.find(group => (group.units as readonly string[]).includes(contentUnit));

  return (
    <div className="space-y-4 rounded-[1.5rem] border border-gray-100 bg-gray-50/70 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
          価格情報
        </label>
        {unitPrice !== null && (
          <span className="text-[10px] font-black text-violet-600 uppercase tracking-wider whitespace-nowrap">
            単価 ¥{unitPrice}
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 mb-2.5 uppercase tracking-widest pl-1">
            購入価格
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={purchasePrice}
            onChange={e => onPurchasePriceChange(e.target.value)}
            className="w-full px-5 py-4 bg-white border border-gray-100 rounded-[1.25rem] focus:bg-white focus:border-gray-200 outline-none transition-all text-right text-xl font-mono font-bold text-gray-900"
            placeholder="例: 298"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-2.5 uppercase tracking-widest pl-1">
              内容量
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={contentAmount}
                onChange={e => onContentAmountChange(e.target.value)}
                className="w-full pl-5 pr-14 py-4 bg-white border border-gray-100 rounded-[1.25rem] focus:bg-white focus:border-gray-200 outline-none transition-all text-right text-xl font-mono font-bold text-gray-900"
                placeholder="例: 500"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col overflow-hidden rounded-[1rem] border border-gray-100 bg-white shadow-sm">
                <button
                  type="button"
                  onPointerDown={() => onStartContentAmountAdjust(1)}
                  onPointerUp={onStopContentAmountAdjust}
                  onPointerLeave={onStopContentAmountAdjust}
                  onPointerCancel={onStopContentAmountAdjust}
                  className="flex h-8 w-10 items-center justify-center bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-200"
                  aria-label="内容量を1増やす"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <div className="h-px bg-gray-100" />
                <button
                  type="button"
                  onPointerDown={() => onStartContentAmountAdjust(-1)}
                  onPointerUp={onStopContentAmountAdjust}
                  onPointerLeave={onStopContentAmountAdjust}
                  onPointerCancel={onStopContentAmountAdjust}
                  className="flex h-8 w-10 items-center justify-center bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-200"
                  aria-label="内容量を1減らす"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-2.5 uppercase tracking-widest pl-1">
              単位
            </label>
            <button
              type="button"
              onClick={onUnitPickerOpen}
              className="w-full px-4 py-4 bg-white border border-gray-100 rounded-[1.25rem] focus:bg-white focus:border-gray-200 outline-none transition-all text-center text-base sm:text-lg font-bold text-gray-900 shadow-sm min-h-[3.75rem]"
              aria-label="内容量の単位を選択"
            >
              {selectedContentUnitGroup ? `${selectedContentUnitGroup.label} / ${contentUnit}` : contentUnit}
            </button>
          </div>
        </div>
      </div>
      <p className="text-[10px] font-medium text-gray-400 leading-relaxed">
        購入価格と内容量を入れると、単価を自動で計算します。最安値はこの単価で比較します。
      </p>
    </div>
  );
}
