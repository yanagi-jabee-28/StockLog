import React from 'react';
import { X } from 'lucide-react';
import { UNIT_GROUPS } from '../../../../constants';

interface UnitPickerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUnit: string;
  onSelectUnit: (unit: string) => void;
}

export function UnitPicker({ isOpen, onClose, currentUnit, onSelectUnit }: UnitPickerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 backdrop-blur-sm p-0 sm:p-6">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] bg-white shadow-2xl max-h-[80vh] overflow-hidden animate-in slide-in-from-bottom-10 duration-200">
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">内容量の単位</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">縦にスクロールして選択</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="単位選択を閉じる"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-900 text-white shadow-lg shadow-gray-200 border border-gray-800 hover:bg-black hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[calc(80vh-92px)] overflow-y-auto px-4 py-4">
          <div className="space-y-4">
            {UNIT_GROUPS.map(group => (
              <div key={group.label} className="rounded-[1.5rem] border border-gray-100 bg-gray-50/70 p-4">
                <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-3 ml-1">{group.label}</p>
                <div className="grid grid-cols-2 gap-2">
                  {group.units.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => onSelectUnit(u)}
                      className={`px-4 py-3 rounded-xl text-sm font-bold border transition-all ${
                        currentUnit === u
                          ? 'bg-violet-50 border-violet-200 text-violet-700 shadow-sm'
                          : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
