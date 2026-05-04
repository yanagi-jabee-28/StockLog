import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface UsageGaugeProps {
  remainingPercent: number;
  alertThresholdPercent: number;
  onUpdateRemaining: (amount: string) => void;
}

export function UsageGauge({
  remainingPercent,
  alertThresholdPercent,
  onUpdateRemaining,
}: UsageGaugeProps) {
  const handlePercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateRemaining(e.target.value);
  };

  const adjustPercent = (delta: number) => {
    const next = Math.max(0, Math.min(100, remainingPercent + delta));
    onUpdateRemaining(next.toString());
  };

  const getGaugeColor = () => {
    if (remainingPercent <= alertThresholdPercent) return 'bg-rose-500';
    if (remainingPercent <= 50) return 'bg-amber-400';
    return 'bg-emerald-400';
  };

  const getTextColor = () => {
    if (remainingPercent <= alertThresholdPercent) return 'text-rose-600';
    if (remainingPercent <= 50) return 'text-amber-600';
    return 'text-emerald-600';
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-end mb-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Remaining Amount</p>
        <span className={`text-xl font-mono font-black transition-colors duration-300 ${getTextColor()} leading-none`}>
          {remainingPercent}<span className="text-[10px] ml-0.5">%</span>
        </span>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          type="button"
          onClick={() => adjustPercent(-25)}
          className="p-2 bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-500 rounded-xl transition-all border border-transparent hover:border-rose-100"
          title="-25%"
        >
          <Minus className="w-3.5 h-3.5" strokeWidth={3} />
        </button>

        <div className="flex-1 relative h-4 bg-gray-50 rounded-full border border-gray-100 overflow-hidden group/gauge shadow-inner">
          <div 
            className={`absolute inset-y-0 left-0 transition-all duration-300 ${getGaugeColor()} shadow-[0_0_10px_rgba(0,0,0,0.05)]`}
            style={{ width: `${remainingPercent}%` }}
          />
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={remainingPercent}
            onChange={handlePercentChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
        </div>

        <button 
          type="button"
          onClick={() => adjustPercent(25)}
          className="p-2 bg-gray-50 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 rounded-xl transition-all border border-transparent hover:border-emerald-100"
          title="+25%"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={3} />
        </button>
      </div>

      <div className="flex justify-between mt-1 px-10">
        <span className="text-[8px] font-bold text-gray-300 uppercase">Empty</span>
        <span className="text-[8px] font-bold text-gray-300 uppercase">Full</span>
      </div>
    </div>
  );
}
