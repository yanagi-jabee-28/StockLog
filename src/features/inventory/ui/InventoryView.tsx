import React from 'react';
import { Plus, Boxes } from 'lucide-react';
import { InventoryItem, Category, ActivityEntry } from '../../../shared/types';
import { useInventoryView } from '../lib/useInventoryView';
import { ActiveItemsList } from './ActiveItemsList';
import { StockItemsList } from './StockItemsList';
import { HistoryLogList } from './HistoryLogList';

interface InventoryViewProps {
  items: InventoryItem[];
  categories: Category[];
  activeCategoryId: string;
  activities: ActivityEntry[];
  incrementStock: (id: string) => void;
  decrementStock: (id: string) => void;
  openItem: (id: string) => void;
  unopenItem: (id: string) => void;
  archiveItem: (id: string) => void;
  updateRemainingAmount: (id: string, amount: string) => void;
  handleDeleteItem: (id: string) => void;
  handleEditItem: (item: InventoryItem) => void;
  handleDuplicateItem: (item: InventoryItem) => void;
  deleteActivity: (id: string) => void;
  updateActivity: (id: string, updates: Partial<ActivityEntry>) => void;
  clearActivities: () => void;
  setIsAddModalOpen: (isOpen: boolean) => void;
  showFloatingAddButton?: boolean;
}

export function InventoryView({
  items,
  categories,
  activeCategoryId,
  activities,
  incrementStock,
  decrementStock,
  openItem,
  unopenItem,
  archiveItem,
  updateRemainingAmount,
  handleDeleteItem,
  handleEditItem,
  handleDuplicateItem,
  deleteActivity,
  updateActivity,
  clearActivities,
  setIsAddModalOpen,
  showFloatingAddButton = true,
}: InventoryViewProps) {
  const { filteredItems, activeItems, unopenedItems, unopenedGroups, totalStockByRootId } = useInventoryView(
    items,
    activeCategoryId
  );

  const showAddItemButton = activeCategoryId !== 'history';

  return (
    <>
      {/* Desktop Category Title & Add Button */}
      <div className="hidden md:flex justify-between items-center mb-12 border-b border-gray-100 pb-10">
        <div>
          <p className="text-[10px] font-bold text-violet-600 uppercase tracking-[0.2em] mb-2">Current Category</p>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none uppercase">
            {activeCategoryId === 'history' ? 'History Log' : categories.find(c => c.id === activeCategoryId)?.name}
          </h2>
        </div>
        {showAddItemButton && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-bold shadow-2xl shadow-gray-200/50 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            アイテムを追加
          </button>
        )}
      </div>

      {/* Mobile Header (Empty space for consistency or category name) */}
      <div className="md:hidden">
         <p className="text-[10px] font-bold text-violet-600 uppercase tracking-[0.2em] mb-2">Current Category</p>
         <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none uppercase">
            {activeCategoryId === 'history' ? 'History Log' : categories.find(c => c.id === activeCategoryId)?.name}
          </h2>
      </div>

      {activeCategoryId === 'history' ? (
        <HistoryLogList 
          activities={activities}
          deleteActivity={deleteActivity}
          updateActivity={updateActivity}
          clearActivities={clearActivities}
        />
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-16 h-16 mb-6 rounded-3xl bg-gray-50 flex items-center justify-center">
            <Boxes className="w-6 h-6 text-gray-200" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">アイテムがありません</h3>
          <p className="text-xs text-gray-400 font-medium max-w-[200px] mx-auto">
             このカテゴリにはまだアイテムが登録されていません。
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          <ActiveItemsList 
            activeItems={activeItems}
            totalStockByRootId={totalStockByRootId}
            activeCategoryId={activeCategoryId}
            incrementStock={incrementStock}
            decrementStock={decrementStock}
            openItem={openItem}
            unopenItem={unopenItem}
            archiveItem={archiveItem}
            updateRemainingAmount={updateRemainingAmount}
            handleDeleteItem={handleDeleteItem}
            handleEditItem={handleEditItem}
            handleDuplicateItem={handleDuplicateItem}
          />

          <StockItemsList 
            unopenedItems={unopenedItems}
            unopenedGroups={unopenedGroups}
            incrementStock={incrementStock}
            decrementStock={decrementStock}
            openItem={openItem}
            handleEditItem={handleEditItem}
            handleDuplicateItem={handleDuplicateItem}
            handleDeleteItem={handleDeleteItem}
          />
        </div>
      )}

      {/* Floating Action Button (Mobile Only) */}
      {showAddItemButton && showFloatingAddButton && (
        <div className="md:hidden fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gray-900 text-white w-14 h-14 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.2)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all outline-none"
            aria-label="アイテムを追加"
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>
      )}
    </>
  );
}
