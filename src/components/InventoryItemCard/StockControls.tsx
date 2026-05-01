import React from 'react';
import { Minus, Plus, BoxSelect, Archive } from 'lucide-react';

interface StockControlsProps {
  id: string;
  stock: number;
  unit: string;
  isOpened: boolean;
  isArchived: boolean;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onOpen?: (id: string) => void;
  onArchive?: (id: string) => void;
}

export function StockControls({
  id,
  stock,
  unit,
  isOpened,
  isArchived,
  onIncrement,
  onDecrement,
  onOpen,
  onArchive,
}: StockControlsProps) {
  return (
    <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">Stock</span>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-mono font-bold tracking-tighter text-gray-900">
            {stock}
          </span>
          <span className="text-xs font-bold text-gray-400">{unit}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {stock > 0 && !isOpened && !isArchived && onOpen && (
          <button
            onClick={() => onOpen(id)}
            className="mr-2 flex items-center gap-1.5 justify-center px-3 py-2.5 bg-violet-50 text-violet-600 hover:bg-violet-100 rounded-xl transition-all"
            title="1つ開封する"
          >
            <BoxSelect className="w-5 h-5" />
            <span className="text-[10px] font-black tracking-wider uppercase">1つ開封</span>
          </button>
        )}

        {isOpened && !isArchived && onArchive && (
           <button
            onClick={() => onArchive(id)}
            className="mr-2 flex items-center justify-center p-2.5 bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
            title="ログに保存"
          >
            <Archive className="w-5 h-5" />
          </button>
        )}

        {!isArchived && !isOpened && (
          <div className="flex items-center gap-3 p-1 bg-gray-50 rounded-[2rem] border border-gray-100">
            <button
              onClick={() => onDecrement(id)}
              disabled={stock <= 0}
              className={`w-12 h-12 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all ${
                stock > 0 
                  ? 'bg-white text-gray-700 shadow-sm hover:text-rose-600 active:scale-95' 
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              aria-label="消費"
            >
              <Minus className="w-5 h-5 md:w-4 md:h-4" strokeWidth={3} />
            </button>
            <button
              onClick={() => onIncrement(id)}
              className="w-12 h-12 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-gray-900 text-white shadow-xl shadow-gray-200 hover:bg-black active:scale-95 transition-all"
              aria-label="追加"
            >
              <Plus className="w-5 h-5 md:w-4 md:h-4" strokeWidth={3} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
