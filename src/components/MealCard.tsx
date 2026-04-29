import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { MealLog } from '../types';

interface MealCardProps {
  mealLog: MealLog;
  onDelete: (id: string) => void;
}

const formatJapaneseDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date);
};

export const MealCard: React.FC<MealCardProps> = ({ mealLog, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div
        className="p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-800">{mealLog.name}</h3>
            <p className="text-xs text-gray-500 mt-1">
              {formatJapaneseDate(mealLog.date)}
            </p>
            {mealLog.ingredients.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {mealLog.ingredients.slice(0, 3).map((ingredient, idx) => (
                  <span
                    key={idx}
                    className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                  >
                    {ingredient}
                  </span>
                ))}
                {mealLog.ingredients.length > 3 && (
                  <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    +{mealLog.ingredients.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            className="p-2 hover:bg-gray-200 rounded-full flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(mealLog.id);
            }}
          >
            <Trash2 size={18} className="text-red-500" />
          </button>
          <div className="p-2 flex-shrink-0">
            {isExpanded ? (
              <ChevronUp size={20} className="text-gray-600" />
            ) : (
              <ChevronDown size={20} className="text-gray-600" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-3">
          {/* All Ingredients */}
          {mealLog.ingredients.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">食材</h4>
              <div className="flex flex-wrap gap-2">
                {mealLog.ingredients.map((ingredient, idx) => (
                  <span
                    key={idx}
                    className="inline-block px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full"
                  >
                    {ingredient}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {mealLog.notes && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">備考</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {mealLog.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
