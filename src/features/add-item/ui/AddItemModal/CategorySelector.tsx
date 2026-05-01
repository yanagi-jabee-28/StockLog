import React from 'react';
import { Category } from '../../../../shared/types';

interface CategorySelectorProps {
  categories: Category[];
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
}

export function CategorySelector({ categories, activeCategoryId, onSelectCategory }: CategorySelectorProps) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-400 mb-2.5 uppercase tracking-widest pl-1">
        カテゴリ
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all ${
              activeCategoryId === cat.id
                ? 'bg-gray-900 text-white border-gray-900 shadow-lg shadow-gray-200'
                : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
