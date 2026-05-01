import React from 'react';
import { MealLog } from '../../../shared/types';
import { MealCard } from './MealCard';
import { Plus, UtensilsCrossed } from 'lucide-react';

interface MealListProps {
  mealLogs: MealLog[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  onEdit: (meal: MealLog) => void;
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
  onEdit,
}) => {
  const groupedLogs = groupMealsByDate(mealLogs);

  if (mealLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-16 h-16 mb-6 rounded-3xl bg-gray-50 flex items-center justify-center">
          <UtensilsCrossed className="w-6 h-6 text-gray-200" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">献立記録がありません</h3>
        <p className="text-xs text-gray-400 font-medium">
           上の「献立を追加」ボタン（スマホは下の「＋」）から、今日の献立を記録しましょう。
        </p>
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
                onEdit={onEdit}
              />
            ))}
          </div>
        </div>
      ))}

    </div>
  );
};
