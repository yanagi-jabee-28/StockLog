import React from 'react';
import { MealLog } from '../types';
import { MealCard } from './MealCard';
import { Plus } from 'lucide-react';

interface MealListProps {
  mealLogs: MealLog[];
  onAdd: () => void;
  onDelete: (id: string) => void;
}

const groupMealsByDate = (
  logs: MealLog[]
): Map<string, MealLog[]> => {
  const grouped = new Map<string, MealLog[]>();

  logs
    .sort((a, b) => b.date - a.date) // Newest first
    .forEach((log) => {
      const date = new Date(log.date);
      const dateKey = new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      }).format(date);

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(log);
    });

  return grouped;
};

export const MealList: React.FC<MealListProps> = ({
  mealLogs,
  onAdd,
  onDelete,
}) => {
  const groupedLogs = groupMealsByDate(mealLogs);

  if (mealLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-gray-500 text-lg mb-4">献立記録がありません</p>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
        >
          <Plus size={20} />
          献立を記録する
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {Array.from(groupedLogs.entries()).map(([dateKey, logsForDate]) => (
        <div key={dateKey}>
          {/* Date Header */}
          <h3 className="px-4 py-2 text-sm font-bold text-gray-700 bg-gradient-to-r from-gray-50 to-transparent mb-3 sticky top-16">
            {dateKey}
          </h3>

          {/* Meals for this date */}
          <div className="space-y-3 px-4">
            {logsForDate.map((log) => (
              <MealCard
                key={log.id}
                mealLog={log}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}

    </div>
  );
};
