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
    <div className={`relative p-5 rounded-[1.75rem] transition-all duration-200 ${
      isAlert 
        ? 'bg-rose-50 border border-rose-200 shadow-sm' 
        : 'bg-white border border-gray-100 hover:shadow-lg hover:border-violet-100 shadow-sm'
    }`}>
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-2 pr-4">
          <div className="flex items-center gap-2">
            <h3 className={`font-extrabold text-xl line-clamp-1 tracking-tight ${isAlert ? 'text-rose-900' : 'text-gray-900'}`}>
              {item.name}
            </h3>
            {isAlert && <AlertCircle className="w-5 h-5 text-rose-50 text-rose-500 fill-rose-50 flex-shrink-0 animate-pulse" />}
            {item.isOpened && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-md border border-amber-200 uppercase tracking-tighter">
                開封済
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
             <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${isAlert ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-500'}`}>
               {item.unit}
             </span>
             <span className={`text-[11px] font-bold tracking-wider uppercase ${isAlert ? 'text-rose-600' : 'text-gray-400'}`}>
               Alert: {item.alertThreshold}
             </span>
          </div>
        </div>
        <button 
          onClick={() => onDelete(item.id)}
          className="p-2 -mt-1 -mr-1 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors flex-shrink-0"
          aria-label="削除"
        >
          <Trash2 className="w-[18px] h-[18px]" />
        </button>
      </div>

      {/* Opened state: Remaining Amount Selector */}
      {item.isOpened && onUpdateRemaining && (
        <div className="mb-5 bg-amber-50/50 p-3 rounded-2xl border border-amber-100">
          <p className="text-[10px] font-black text-amber-600 uppercase mb-2 tracking-widest pl-1">Remaining Status</p>
          
          {/* Custom Weight/Volume Input if unit is g/ml */}
          {['g', 'ml', 'グラム', 'ミリリットル'].includes(item.unit.toLowerCase()) ? (
            <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-amber-100">
              <input
                type="number"
                value={parseInt(item.remainingAmount || '0') || ''}
                onChange={(e) => onUpdateRemaining(item.id, e.target.value + item.unit)}
                placeholder={`残り (${item.unit})`}
                className="flex-1 bg-transparent px-3 py-1.5 text-sm font-bold text-amber-900 outline-none placeholder:text-amber-200"
              />
              <span className="text-xs font-black text-amber-400 pr-3 uppercase tracking-tighter">
                {item.unit}
              </span>
            </div>
          ) : (
            <div className="flex justify-between items-center gap-1.5">
              {REMAINING_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => onUpdateRemaining(item.id, opt)}
                  className={`flex-1 text-[10px] py-2 rounded-xl font-bold transition-all ${
                    item.remainingAmount === opt 
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-200' 
                      : 'bg-white text-amber-700 border border-amber-100 hover:bg-amber-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-center mt-auto">
        {/* Open Button (Visible if stock > 0 and not already opened) */}
        <div className="flex-1">
           {item.stock > 0 && !item.isOpened && onOpen ? (
             <button
               onClick={() => onOpen(item.id)}
               className="flex items-center gap-1.5 px-4 py-2 bg-violet-50 text-violet-600 hover:bg-violet-100 rounded-full transition-all text-xs font-black uppercase tracking-tight"
             >
               <BoxSelect className="w-4 h-4" />
               開封する
             </button>
           ) : (
             <div className="text-gray-400 text-sm font-bold pl-1 uppercase tracking-widest">
               Stock
             </div>
           )}
        </div>

        {/* Action Controls */}
        <div className={`flex items-center gap-3 p-1.5 rounded-full border ${isAlert ? 'bg-white border-rose-100' : 'bg-gray-50 border-gray-100'}`}>
          <button
            onClick={() => onIncrement(item.id)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-violet-600 shadow-sm border border-gray-100 active:scale-95 transition-all hover:bg-violet-50"
            aria-label="追加"
          >
            <Plus className="w-[18px] h-[18px]" strokeWidth={3} />
          </button>
          
          <div className="w-10 text-center flex flex-col items-center justify-center">
            <span className={`text-2xl font-black tracking-tighter leading-none ${isAlert ? 'text-rose-600' : 'text-gray-900'}`}>
              {item.stock}
            </span>
          </div>

          <button
            onClick={() => onDecrement(item.id)}
            disabled={item.stock <= 0}
            className={`w-12 h-12 flex items-center justify-center rounded-full text-white shadow-md transition-all ${
              item.stock > 0 
                ? 'bg-violet-600 active:scale-95 hover:bg-violet-500 shadow-violet-200' 
                : 'bg-gray-200 cursor-not-allowed shadow-none'
            }`}
            aria-label="消費"
          >
            <Minus className="w-[20px] h-[20px]" strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}
