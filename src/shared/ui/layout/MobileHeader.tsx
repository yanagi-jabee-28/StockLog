import React from 'react';
import { Settings, Boxes, UtensilsCrossed, Grid2x2, History } from 'lucide-react';
import { Category } from '../../types';
import { APP_LAST_UPDATED, CATEGORY_IDS } from '../../../constants';

interface MobileHeaderProps {
  categories: Category[];
  activeTab: 'stock' | 'selection' | 'meals';
  activeCategoryId: string;
  setActiveTab: (tab: 'stock' | 'selection' | 'meals') => void;
  setActiveCategoryId: (id: string) => void;
  setIsCategoryPickerOpen: (isOpen: boolean) => void;
  setIsSettingsModalOpen: (isOpen: boolean) => void;
}

export function MobileHeader({
  categories,
  activeTab,
  activeCategoryId,
  setActiveTab,
  setActiveCategoryId,
  setIsCategoryPickerOpen,
  setIsSettingsModalOpen
}: MobileHeaderProps) {
  return (
    <header className="md:hidden bg-white/80 backdrop-blur-md sticky top-0 px-6 pt-10 pb-4 border-b border-gray-100 shrink-0 relative z-30">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-black tracking-tight text-gray-900 flex items-center gap-2">
          <span className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center text-white text-base font-black">S</span>
          StockLog
        </h1>
        <button 
          onClick={() => setIsSettingsModalOpen(true)}
          className="w-10 h-10 flex items-center justify-center text-gray-400 bg-gray-50 rounded-full"
          aria-label="設定"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <p className="mb-4 text-[10px] font-medium text-gray-400 tracking-wide">
        最終更新 {APP_LAST_UPDATED}
      </p>

      {/* Top Navigation removed in favor of Bottom Navigation */}

      {activeTab === 'stock' && (
      <>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">カテゴリ</p>
        <button
          onClick={() => setIsCategoryPickerOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-600 shadow-sm"
          aria-label="カテゴリ一覧を開く"
        >
          <Grid2x2 className="w-3 h-3" />
          一覧表示
        </button>
      </div>

      <div className="flex overflow-x-auto hide-scrollbar gap-2 -mx-6 px-6 pb-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => {
              setActiveTab('stock');
              setActiveCategoryId(category.id);
            }}
            className={`whitespace-nowrap px-5 py-2 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all border ${
              activeCategoryId === category.id
                ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                : 'bg-white text-gray-400 border-gray-100'
            }`}
          >
            {category.name}
          </button>
        ))}
        <button
          onClick={() => {
            setActiveTab('stock');
            setActiveCategoryId('history');
          }}
          className={`whitespace-nowrap px-5 py-2 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all border flex items-center gap-1.5 ${
            activeCategoryId === 'history'
              ? 'bg-gray-900 text-white border-gray-900 shadow-md'
              : 'bg-white text-gray-400 border-gray-100'
          }`}
        >
          <History className="w-3 h-3" />
          History
        </button>
      </div>
      </>
      )}

    </header>
  );
}