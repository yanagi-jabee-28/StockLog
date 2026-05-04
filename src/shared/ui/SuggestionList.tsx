import React from 'react';
import { BoxSelect } from 'lucide-react';
import { InventoryItem, Category } from '../types';

interface SuggestionListProps {
  suggestions: InventoryItem[];
  categories: Category[];
  onSelect: (item: InventoryItem) => void;
}

export function SuggestionList({ suggestions, categories, onSelect }: SuggestionListProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-gray-100 rounded-[1.5rem] shadow-2xl shadow-gray-200/50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="p-2 border-b border-gray-50 bg-gray-50/50">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest pl-2">登録済みの商品から入力</p>
      </div>
      <div className="max-h-60 overflow-y-auto">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            type="button"
            onClick={() => onSelect(suggestion)}
            className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between group/sug"
          >
            <div className="flex flex-col">
              <span className="font-bold text-gray-900 text-sm">{suggestion.name}</span>
              <span className="text-[10px] text-gray-400 font-medium">
                {categories.find(c => c.id === suggestion.categoryId)?.name} · {suggestion.unit}
                {suggestion.contentAmount !== undefined && suggestion.contentUnit ? ` · ${suggestion.contentAmount}${suggestion.contentUnit}` : ''}
                {suggestion.expiryDate ? ` · 期限 ${suggestion.expiryDate}` : ''}
              </span>
            </div>
            <BoxSelect className="w-4 h-4 text-gray-200 group-hover/sug:text-violet-400 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
