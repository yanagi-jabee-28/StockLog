import React, { useState } from 'react';
import { Settings, Plus, Boxes } from 'lucide-react';
import { useInventory } from './hooks/useInventory';
import { InventoryItemCard } from './components/InventoryItemCard';
import { AddItemModal } from './components/AddItemModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const { 
    items, 
    categories, 
    addItem, 
    incrementStock, 
    decrementStock, 
    deleteItem,
    openItem,
    updateRemainingAmount,
    reloadData
  } = useInventory();
  
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id || 'priority');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // If categories finish loading asynchronously and active is out of sync, set it safely
  if (categories.length > 0 && !categories.find(c => c.id === activeCategoryId)) {
    setActiveCategoryId(categories[0].id);
  }

  const filteredItems = items.filter(item => item.categoryId === activeCategoryId);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 text-gray-900 overflow-hidden font-sans xl:max-w-[1400px] xl:mx-auto xl:shadow-[0_0_80px_rgba(0,0,0,0.05)] xl:my-6 xl:h-[calc(100vh-3rem)] xl:rounded-[2.5rem] border-gray-200">
      
      {/* Desktop Sidebar (Professional Polish) */}
      <aside className="hidden md:flex flex-col w-72 lg:w-80 bg-white border-r border-gray-100 shadow-sm z-20 shrink-0">
        <div className="p-8 flex items-center justify-between">
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-br from-violet-600 to-fuchsia-600 bg-clip-text text-transparent flex items-center gap-2">
            StockLog
          </h1>
        </div>
        
        <div className="px-5 pb-2 overflow-y-auto">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-3">Categories</p>
          <div className="flex flex-col gap-1.5">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategoryId(category.id)}
                className={`text-left px-5 py-3.5 rounded-2xl font-bold transition-all ${
                  activeCategoryId === category.id 
                    ? 'bg-violet-50 text-violet-700 shadow-sm' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mt-auto p-5 border-t border-gray-50 flex flex-col gap-3">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-3 w-full px-5 py-4 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-2xl transition-colors font-bold"
          >
            <Settings className="w-5 h-5" />
            設定・データ管理
          </button>
          
          <a 
            href="https://ai.studio/apps/cf93f8bf-7fd1-41ca-9a7c-e8395e8891e8" 
            target="_blank" 
            rel="noopener noreferrer"
            className="mx-3 py-2 text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] text-center hover:text-violet-500 transition-colors"
          >
            Powered by Google AI Studio
          </a>
        </div>
      </aside>

      {/* Mobile Header (Vibrant & Compact) */}
      <header className="md:hidden bg-white px-5 pt-8 pb-3 shadow-sm z-20 shrink-0">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-br from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            StockLog
          </h1>
          <button 
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-colors"
            aria-label="設定"
          >
            <Settings className="w-[22px] h-[22px]" />
          </button>
        </div>

        {/* Category Tabs (Horizontal Scroll) */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1 -mx-5 px-5">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategoryId(category.id)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeCategoryId === category.id
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center bg-[#f8f9fa] overflow-y-auto relative z-0">
        <div className="w-full max-w-5xl px-4 py-6 md:p-10 shrink-0 mb-20 md:mb-0">
          
          {/* Desktop Category Title & Add Button */}
          <div className="hidden md:flex justify-between items-end mb-8 border-b border-gray-200 pb-6">
            <div>
              <p className="text-sm font-bold text-violet-600 uppercase tracking-widest mb-1">Current Category</p>
              <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                {categories.find(c => c.id === activeCategoryId)?.name}
              </h2>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3.5 rounded-2xl font-bold shadow-xl shadow-violet-200/50 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              アイテムを追加
            </button>
          </div>

          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 mb-6 rounded-full bg-violet-50 flex items-center justify-center">
                <Boxes className="w-10 h-10 text-violet-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">アイテムがありません</h3>
              <p className="text-gray-500 font-medium">
                <span className="hidden md:inline">右上の「アイテムを追加」ボタンから登録してください</span>
                <span className="md:hidden">右下の「＋」ボタンから追加してください</span>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-5">
              {filteredItems.map(item => (
                <InventoryItemCard
                  key={item.id}
                  item={item}
                  onIncrement={incrementStock}
                  onDecrement={decrementStock}
                  onDelete={deleteItem}
                  onOpen={openItem}
                  onUpdateRemaining={updateRemainingAmount}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button (Mobile Only) */}
      <div className="md:hidden fixed bottom-6 right-0 left-0 max-w-md mx-auto pointer-events-none px-6 z-30">
        <div className="flex justify-end">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="pointer-events-auto bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white w-[68px] h-[68px] rounded-full shadow-[0_8px_30px_rgb(124,58,237,0.3)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all outline-none"
            aria-label="アイテムを追加"
          >
            <Plus className="w-8 h-8" />
          </button>
        </div>
      </div>

      {/* Modals */}
      <AddItemModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        categories={categories}
        onAdd={addItem}
        initialCategory={activeCategoryId}
      />
      
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onDataImported={reloadData}
      />
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
