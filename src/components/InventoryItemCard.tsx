import React from 'react';
import { InventoryItem } from '../types';
import { Minus, Plus, AlertCircle, Trash2, BoxSelect } from 'lucide-react';

interface InventoryItemCardProps {
  item: InventoryItem;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onDelete: (id: string) => void;
  onOpen?: (id: string) => void;
  onUpdateRemaining?: (id: string, amount: string) => void;
}

const REMAINING_OPTIONS = ['100%', '75%', '50%', '25%', 'ほぼ空'];

export const InventoryItemCard: React.FC<InventoryItemCardProps> = ({ item, onIncrement, onDecrement, onDelete, onOpen, onUpdateRemaining }) => {
  const isAlert = item.stock <= item.alertThreshold;

  return (
    <div className="group relative bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-violet-500/5 hover:border-violet-100 transition-all duration-300 flex flex-col min-h-[180px]">
      
      {/* Status Indicators Layer */}
      <div className="absolute top-4 right-4 flex gap-2">
        {item.isOpened && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-100 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            開封済
          </span>
        )}
        {isAlert && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-full border border-rose-100 whitespace-nowrap animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            在庫僅少
          </span>
        )}
        <button 
          onClick={() => onDelete(item.id)}
          className="p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
          aria-label="削除"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-1 mb-6">
        <h3 className="font-bold text-lg text-gray-900 tracking-tight leading-tight pr-20 line-clamp-1">
          {item.name}
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">
            {item.unit}
          </span>
          <span className="text-[10px] font-medium text-gray-300 tracking-wider">
            閾値: {item.alertThreshold}
          </span>
        </div>
      </div>

      {/* Opened state: Remaining Amount Selector */}
      {item.isOpened && onUpdateRemaining && (
        <div className="mb-6">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2.5 tracking-widest">残り</p>
          
          {['g', 'ml', 'グラム', 'ミリリットル'].includes(item.unit.toLowerCase()) ? (
            <div className="relative flex items-center group/input">
              <input
                type="number"
                value={parseInt(item.remainingAmount || '0') || ''}
                onChange={(e) => onUpdateRemaining(item.id, e.target.value + item.unit)}
                placeholder="0"
                className="w-full bg-gray-50 px-4 py-2 rounded-xl text-sm font-mono font-bold text-gray-900 outline-none border border-transparent focus:border-amber-200 focus:bg-white transition-all text-right pr-12"
              />
              <span className="absolute right-4 text-[10px] font-bold text-gray-400">
                {item.unit}
              </span>
            </div>
          ) : (
            <div className="flex gap-1">
              {REMAINING_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => opt !== item.remainingAmount && onUpdateRemaining(item.id, opt)}
                  className={`flex-1 text-[10px] py-1.5 rounded-lg font-bold transition-all border ${
                    item.remainingAmount === opt 
                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm' 
                      : 'bg-white text-gray-500 border-gray-100 hover:border-amber-200 hover:text-amber-600'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
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
          {item.stock > 0 && !item.isOpened && onOpen && (
            <button
              onClick={() => onOpen(item.id)}
              className="mr-2 flex items-center justify-center p-2.5 bg-violet-50 text-violet-600 hover:bg-violet-100 rounded-xl transition-all"
              title="開封する"
            >
              <BoxSelect className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center p-1 bg-gray-50 rounded-2xl border border-gray-100">
            <button
              onClick={() => onDecrement(item.id)}
              disabled={item.stock <= 0}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                item.stock > 0 
                  ? 'bg-white text-gray-700 shadow-sm hover:text-rose-600 active:scale-95' 
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              aria-label="消費"
            >
              <Minus className="w-4 h-4" strokeWidth={3} />
            </button>
            <button
              onClick={() => onIncrement(item.id)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-200 hover:bg-violet-700 active:scale-95 transition-all"
              aria-label="追加"
            >
              <Plus className="w-4 h-4" strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
