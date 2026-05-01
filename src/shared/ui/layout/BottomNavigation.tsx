import React from 'react';
import { Plus, Boxes, UtensilsCrossed, Sparkles } from 'lucide-react';
import { Category } from '../../types';
import { CATEGORY_IDS } from '../../../constants';

interface BottomNavigationProps {
  activeTab: 'stock' | 'selection' | 'meals';
  activeCategoryId: string;
  categories: Category[];
  selectedItemCount: number;
  onTabChange: (tab: 'stock' | 'selection' | 'meals') => void;
  onCategoryIdChange: (id: string) => void;
  onAddClick: () => void;
}

export function BottomNavigation({
  activeTab,
  activeCategoryId,
  categories,
  selectedItemCount,
  onTabChange,
  onCategoryIdChange,
  onAddClick,
}: BottomNavigationProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 z-40 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
      <div className="grid grid-cols-[1fr_auto_1fr] h-16 px-2">
        <div className="flex items-center justify-around">
          <button
            onClick={() => {
              onTabChange('stock');
              if (activeCategoryId === 'history') {
                onCategoryIdChange(categories[0]?.id || CATEGORY_IDS.fresh);
              }
            }}
            className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${
              activeTab === 'stock' ? 'text-gray-900' : 'text-gray-400'
            }`}
          >
            <Boxes className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold">在庫</span>
          </button>

          <button
            onClick={() => onTabChange('selection')}
            className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${
              activeTab === 'selection' ? 'text-gray-900' : 'text-gray-400'
            }`}
          >
            <div className="relative">
              <Sparkles className="w-6 h-6 mb-1" />
              {selectedItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white">
                  {selectedItemCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold">選択</span>
          </button>
        </div>

        <div className="flex items-center justify-center w-16">
          <div className="-mt-6">
            <button
              onClick={onAddClick}
              className="bg-gray-900 text-white w-14 h-14 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all outline-none"
              aria-label={activeTab === 'stock' || activeTab === 'selection' ? 'アイテムを追加' : '献立を追加'}
            >
              <Plus className="w-7 h-7" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-around">
          <button
            onClick={() => onTabChange('meals')}
            className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${
              activeTab === 'meals' ? 'text-gray-900' : 'text-gray-400'
            }`}
          >
            <UtensilsCrossed className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold">献立</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
