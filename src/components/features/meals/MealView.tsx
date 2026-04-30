import React from 'react';
import { MealList } from '../../MealList';
import { MealLog } from '../../../types';

interface MealViewProps {
  mealLogs: MealLog[];
  setIsAddMealModalOpen: (isOpen: boolean) => void;
  deleteMealLog: (id: string) => void;
}

export function MealView({
  mealLogs,
  setIsAddMealModalOpen,
  deleteMealLog
}: MealViewProps) {
  return (
    <>
      {/* Meals View */}
      <div>
        <p className="text-[10px] font-bold text-violet-600 uppercase tracking-[0.2em] mb-2">献立記録</p>
        <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none uppercase">Meal Logs</h2>
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
