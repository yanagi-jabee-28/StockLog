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
    <div className="flex flex-col md:flex-row h-screen bg-[#f8f9fa] text-gray-900 overflow-hidden font-sans xl:max-w-[1400px] xl:mx-auto xl:shadow-[0_0_80px_rgba(0,0,0,0.05)] xl:my-6 xl:h-[calc(100vh-3rem)] xl:rounded-[2.5rem] border-gray-100">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 lg:w-80 bg-white border-r border-gray-100 shrink-0 relative z-20">
        <div className="p-10 flex items-center">
          <h1 className="text-2xl font-black tracking-tight text-gray-900 flex items-center gap-3">
            <span className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center text-white text-lg font-black shadow-lg shadow-gray-200">S</span>
            StockLog
          </h1>
        </div>
        
        <div className="px-6 pb-2 overflow-y-auto">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-6 px-4">Categories</p>
          <div className="flex flex-col gap-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategoryId(category.id)}
                className={`text-left px-6 py-4 rounded-2xl text-sm font-bold transition-all ${
                  activeCategoryId === category.id 
                    ? 'bg-gray-900 text-white shadow-xl shadow-gray-200' 
                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
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
          
          <div className="flex flex-col items-center">
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

      {/* Mobile Header */}
      <header className="md:hidden bg-white px-6 pt-10 pb-6 border-b border-gray-100 shrink-0 relative z-20">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black tracking-tight text-gray-900 flex items-center gap-2">
            <span className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center text-white text-lg font-black">S</span>
            StockLog
          </h1>
          <button 
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-2 text-gray-400"
            aria-label="設定"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="flex overflow-x-auto hide-scrollbar gap-2 -mx-6 px-6">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategoryId(category.id)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-full text-xs font-bold transition-all border ${
                activeCategoryId === category.id
                  ? 'bg-gray-900 text-white border-gray-900 shadow-lg shadow-gray-200'
                  : 'bg-white text-gray-400 border-gray-100'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center bg-[#fbfbfc] overflow-y-auto relative z-0">
        <div className="w-full max-w-6xl px-6 py-8 md:p-12 shrink-0 mb-20 md:mb-0">
          
          {/* Desktop Category Title & Add Button */}
          <div className="hidden md:flex justify-between items-center mb-12 border-b border-gray-100 pb-10">
            <div>
              <p className="text-[10px] font-bold text-violet-600 uppercase tracking-[0.2em] mb-2">Current Category</p>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                {categories.find(c => c.id === activeCategoryId)?.name}
              </h2>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-bold shadow-2xl shadow-gray-200/50 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              アイテムを追加
            </button>
          </div>

          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-20 h-20 mb-8 rounded-full bg-gray-50 flex items-center justify-center">
                <Boxes className="w-8 h-8 text-gray-200" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">アイテムがありません</h3>
              <p className="text-sm text-gray-400 font-medium max-w-xs">
                 このカテゴリにはまだアイテムが登録されていません。新しいアイテムを追加しましょう。
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
      <div className="md:hidden fixed bottom-8 right-8 z-30">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-gray-900 text-white w-16 h-16 rounded-2xl shadow-2xl shadow-gray-400 flex items-center justify-center hover:scale-105 active:scale-95 transition-all outline-none"
          aria-label="アイテムを追加"
        >
          <Plus className="w-8 h-8" />
        </button>
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
