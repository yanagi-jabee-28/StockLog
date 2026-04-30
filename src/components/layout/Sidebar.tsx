import React from 'react';
import { Grid2x2, History, UtensilsCrossed, Settings } from 'lucide-react';
import { Category, InventoryItem } from '../../types';
import { APP_LAST_UPDATED } from '../../constants';

interface SidebarProps {
  categories: Category[];
  items: InventoryItem[];
  activeTab: 'stock' | 'meals';
  activeCategoryId: string;
  setActiveTab: (tab: 'stock' | 'meals') => void;
  setActiveCategoryId: (id: string) => void;
  setIsCategoryPickerOpen: (isOpen: boolean) => void;
  setIsSettingsModalOpen: (isOpen: boolean) => void;
}

export function Sidebar({
  categories,
  items,
  activeTab,
  activeCategoryId,
  setActiveTab,
  setActiveCategoryId,
  setIsCategoryPickerOpen,
  setIsSettingsModalOpen
}: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-72 lg:w-80 bg-white border-r border-gray-100 shrink-0 relative z-20">
      <div className="p-10 flex items-center">
        <h1 className="text-2xl font-black tracking-tight text-gray-900 flex items-center gap-3">
          <span className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center text-white text-lg font-black shadow-lg shadow-gray-200">S</span>
          StockLog
        </h1>
      </div>
      
      <div className="px-6 pb-2 overflow-y-auto">
        {/* Tab Navigation for PC */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => {
              setActiveTab('stock');
              if (activeCategoryId === 'history') {
                setActiveCategoryId(categories[0]?.id || 'fresh');
              }
            }}
            className={`flex-1 px-4 py-3 rounded-2xl text-[11px] font-bold tracking-wider uppercase transition-all border flex items-center justify-center gap-2 ${
              activeTab === 'stock'
                ? 'bg-gray-900 text-white border-gray-900 shadow-xl shadow-gray-200'
                : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Grid2x2 className="w-4 h-4" />
            在庫
          </button>
          <button
            onClick={() => setActiveTab('meals')}
            className={`flex-1 px-4 py-3 rounded-2xl text-[11px] font-bold tracking-wider uppercase transition-all border flex items-center justify-center gap-2 ${
              activeTab === 'meals'
                ? 'bg-gray-900 text-white border-gray-900 shadow-xl shadow-gray-200'
                : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            献立
          </button>
        </div>

        {activeTab === 'stock' && (
          <>
            <div className="mb-4 px-4 flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Categories</p>
              <button
                onClick={() => setIsCategoryPickerOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-600 shadow-sm hover:border-gray-300 hover:text-gray-900 transition-all"
                aria-label="カテゴリ一覧を開く"
              >
                <Grid2x2 className="w-3 h-3" />
                一覧表示
              </button>
            </div>
        <div className="flex flex-col gap-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setActiveTab('stock');
                setActiveCategoryId(category.id);
              }}
              className={`text-left px-6 py-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-between group ${
                activeCategoryId === category.id 
                  ? 'bg-gray-900 text-white shadow-xl shadow-gray-200' 
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span>{category.name}</span>
              {items.filter(i => !i.isArchived && i.categoryId === category.id).length > 0 && (
                 <span className={`text-[10px] px-2 py-0.5 rounded-md border ${
                   activeCategoryId === category.id ? 'bg-white/10 border-white/20' : 'bg-gray-50 border-gray-100'
                 }`}>
                   {items.filter(i => !i.isArchived && i.categoryId === category.id).length}
                 </span>
              )}
            </button>
          ))}
          
          <div className="mt-8 pt-8 border-t border-gray-100">
             <button
              onClick={() => {
                setActiveTab('stock');
                setActiveCategoryId('history');
              }}
              className={`text-left px-6 py-4 rounded-2xl text-sm font-bold transition-all flex items-center gap-3 w-full group ${
                activeTab === 'stock' && activeCategoryId === 'history'
                  ? 'bg-gray-900 text-white shadow-xl shadow-gray-200' 
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <History className={`w-4 h-4 transition-transform ${activeTab === 'stock' && activeCategoryId === 'history' ? 'scale-110' : 'text-gray-300'}`} />
              <span>History Log</span>
            </button>
          </div>
        </div>
        </>
        )}
      </div>
      
      <div className="mt-auto p-6">
        <div className="p-4 bg-gray-50 rounded-[2rem] border border-gray-100 mb-4">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-3 w-full px-5 py-3.5 text-gray-500 hover:text-gray-900 transition-colors font-bold text-sm"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] font-medium text-gray-400 tracking-wide">
            最終更新 {APP_LAST_UPDATED}
          </p>
          <a 
            href="https://ai.studio/apps/cf93f8bf-7fd1-41ca-9a7c-e8395e8891e8" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em] hover:text-violet-500 transition-colors"
          >
            Google AI Studio
          </a>
        </div>
      </div>
    </aside>
  );
}
