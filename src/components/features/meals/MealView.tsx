import React from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { MealList } from '../../MealList';
import { MealLog } from '../../../types';

interface MealViewProps {
  mealLogs: MealLog[];
  setIsAddMealModalOpen: (isOpen: boolean) => void;
  deleteMealLog: (id: string) => void;
  onCopyRecent?: () => void;
}

export function MealView({
  mealLogs,
  setIsAddMealModalOpen,
  deleteMealLog,
  onCopyRecent
}: MealViewProps) {
  return (
    <>
      {/* Meals View Desktop Header */}
      <div className="hidden md:flex justify-between items-center mb-12 border-b border-gray-100 pb-10">
        <div>
          <p className="text-[10px] font-bold text-violet-600 uppercase tracking-[0.2em] mb-2">献立記録</p>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none uppercase">Meal Logs</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onCopyRecent?.()}
            className="flex items-center gap-2 bg-white border border-gray-100 hover:bg-gray-50 text-gray-600 px-6 py-4 rounded-2xl font-bold shadow-sm transition-all active:scale-95"
            title="直近の献立をコピー"
          >
            <Sparkles className="w-5 h-5 text-violet-600" />
            AI用コピー
          </button>
          <button
            onClick={() => setIsAddMealModalOpen(true)}
            className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-bold shadow-2xl shadow-gray-200/50 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            献立を追加
          </button>
        </div>
      </div>
      
      {/* Mobile Header (similar to Desktop but simpler) */}
      <div className="md:hidden">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-[10px] font-bold text-violet-600 uppercase tracking-[0.2em] mb-2">献立記録</p>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none uppercase">Meal Logs</h2>
          </div>
          <button
            onClick={() => onCopyRecent?.()}
            className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm text-gray-500"
            title="直近の献立をコピー"
          >
            <Sparkles className="w-5 h-5 text-violet-600" />
          </button>
        </div>
      </div>
      <div className="mt-8">
        <MealList
          mealLogs={mealLogs}
          onAdd={() => setIsAddMealModalOpen(true)}
          onDelete={deleteMealLog}
        />
      </div>
    </>
  );
}
