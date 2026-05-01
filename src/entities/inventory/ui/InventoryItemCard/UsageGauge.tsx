import React from 'react';

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

  return (
    <div className="mb-8">
      <div className="flex justify-between items-end mb-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Remaining Amount</p>
        <span className="text-xl font-mono font-black text-amber-600 leading-none">
          {remainingPercent}<span className="text-[10px] ml-0.5">%</span>
        </span>
      </div>
      
      <div className="relative h-4 bg-gray-50 rounded-full border border-gray-100 overflow-hidden group/gauge">
        <div 
          className={`absolute inset-y-0 left-0 transition-all duration-300 ${
            remainingPercent <= alertThresholdPercent ? 'bg-rose-500' : 'bg-amber-400'
          }`}
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
      <div className="flex justify-between mt-1 px-1">
        <span className="text-[8px] font-bold text-gray-300 uppercase">Empty</span>
        <span className="text-[8px] font-bold text-gray-300 uppercase">Full</span>
      </div>
    </div>
  );
}
