import React, { useEffect, useState } from 'react';
import { Plus, Boxes, UtensilsCrossed } from 'lucide-react';
import { useInventory } from './hooks/useInventory';
import { useMealLog } from './hooks/useMealLog';
import { Sidebar } from './components/layout/Sidebar';
import { MobileHeader } from './components/layout/MobileHeader';
import { MealView } from './components/features/meals/MealView';
import { SelectionView } from './components/features/selection/SelectionView';
import { InventoryView } from './components/features/inventory/InventoryView';
import { AddItemModal } from './components/AddItemModal';
import { SettingsModal } from './components/SettingsModal';
import { AddMealModal } from './components/AddMealModal';
import { CategoryPickerModal } from './components/features/inventory/CategoryPickerModal';
import { DeleteConfirmModal } from './components/features/inventory/DeleteConfirmModal';
import { InventoryItem } from './types';
import { useModalNavigation } from './hooks/useModalNavigation';
import { CATEGORY_IDS } from './constants';
import { logError, logInfo, logWarn } from './lib/logger';
import { formatForAi, copyToClipboard } from './lib/clipboard';
import { Sparkles, Check, Copy } from 'lucide-react';

export default function App() {
  const { 
    items, 
    categories, 
    addItem, 
    incrementStock, 
    decrementStock, 
    deleteItem,
    openItem,
    unopenItem,
    updateRemainingAmount,
    updateItem,
    archiveItem,
    activities,
    deleteActivity,
    updateActivity,
    clearActivities,
    reloadData
  } = useInventory();

  const {
    mealLogs,
    addMealLog,
    deleteMealLog,
  } = useMealLog();
  
  const [activeTab, setActiveTab] = useState<'stock' | 'selection' | 'meals'>('stock');
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id || CATEGORY_IDS.fresh);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isDuplicateMode, setIsDuplicateMode] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddMealModalOpen, setIsAddMealModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    item: InventoryItem;
    linkedOpenedCount: number;
  } | null>(null);

  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);

  useModalNavigation(!!deleteConfirmState, () => setDeleteConfirmState(null), 'delete-confirm-modal');
  useModalNavigation(isCategoryPickerOpen, () => setIsCategoryPickerOpen(false), 'category-picker-modal');

  const showAddItemButton = activeCategoryId !== 'history';

  const handleEditItem = (item: InventoryItem) => {
    setIsDuplicateMode(false);
    setEditingItem(item);
    setIsAddModalOpen(true);
  };

  const handleDuplicateItem = (item: InventoryItem) => {
    setIsDuplicateMode(true);
    // When duplicating, we want a new item with same metadata but stock starts at 0 or same as source
    setEditingItem(item); 
    setIsAddModalOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    logInfo('Delete requested from UI', { id });
    const target = items.find(item => item.id === id);
    if (!target) {
      logWarn('Delete target not found when opening confirmation', { id, itemCount: items.length });
      return;
    }

    const linkedOpenedCount = target.isOpened
      ? 0
      : items.filter(item => item.isOpened && item.originalItemId === id).length;

    setDeleteConfirmState({
      item: target,
      linkedOpenedCount,
    });
    logInfo('Delete confirmation opened', { id, linkedOpenedCount, isOpened: !!target.isOpened });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmState) {
      logWarn('Delete confirm clicked without confirmation state');
      return;
    }

    try {
      logInfo('Delete confirmed', { id: deleteConfirmState.item.id });
      deleteItem(deleteConfirmState.item.id);
      setDeleteConfirmState(null);
    } catch (error) {
      logError('Delete execution failed in App', error);
    }
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setEditingItem(null);
    setIsDuplicateMode(false);
  };

  const handleAddMealLog = (mealData: { date: number; name: string; ingredients: string[]; notes: string }) => {
    addMealLog(mealData);
    setIsAddMealModalOpen(false);
  };

  const handleToggleSelection = (id: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyForAi = async (type: 'selected' | 'all' | 'meals', includeMealsInSelection: boolean = false) => {
    let text = "";
    if (type === 'selected') {
      const selectedItems = items.filter(item => selectedItemIds.has(item.id));
      text = formatForAi(selectedItems, categories, includeMealsInSelection ? mealLogs : []);
    } else if (type === 'all') {
      text = formatForAi(items, categories, []);
    } else if (type === 'meals') {
      text = formatForAi([], categories, mealLogs);
    }

    if (text) {
      const success = await copyToClipboard(text);
      if (success) {
        setShowCopyToast(true);
        setTimeout(() => setShowCopyToast(false), 2000);
        if (type === 'selected') {
          setIsSelectionMode(false);
          setSelectedItemIds(new Set());
        }
      }
    }
  };

  useEffect(() => {
    if (categories.length === 0) return;
    if (activeCategoryId === 'history') return;

    const isValidCategory = categories.some((category) => category.id === activeCategoryId);
    if (!isValidCategory) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories, activeCategoryId]);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#f8f9fa] text-gray-900 overflow-hidden font-sans xl:max-w-[1400px] xl:mx-auto xl:shadow-[0_0_80px_rgba(0,0,0,0.05)] xl:my-6 xl:h-[calc(100vh-3rem)] xl:rounded-[2.5rem] border-gray-100">
      <Sidebar
        categories={categories}
        items={items}
        activeTab={activeTab}
        activeCategoryId={activeCategoryId}
        setActiveTab={setActiveTab}
        setActiveCategoryId={setActiveCategoryId}
        setIsCategoryPickerOpen={setIsCategoryPickerOpen}
        setIsSettingsModalOpen={setIsSettingsModalOpen}
      />

      <MobileHeader
        categories={categories}
        activeTab={activeTab}
        activeCategoryId={activeCategoryId}
        setActiveTab={setActiveTab}
        setActiveCategoryId={setActiveCategoryId}
        setIsCategoryPickerOpen={setIsCategoryPickerOpen}
        setIsSettingsModalOpen={setIsSettingsModalOpen}
      />

      <CategoryPickerModal
        isOpen={isCategoryPickerOpen}
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelectCategory={(categoryId) => {
          setActiveTab('stock');
          setActiveCategoryId(categoryId);
        }}
        onClose={() => setIsCategoryPickerOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center bg-[#fbfbfc] overflow-y-auto relative z-0">
        <div className="w-full max-w-6xl px-4 py-6 md:p-12 shrink-0 mb-28 md:mb-0">
          
          {activeTab === 'meals' ? (
            <MealView 
              mealLogs={mealLogs}
              setIsAddMealModalOpen={setIsAddMealModalOpen}
              deleteMealLog={deleteMealLog}
            />
          ) : activeTab === 'selection' ? (
            <SelectionView
              items={items}
              categories={categories}
              mealLogs={mealLogs}
              selectedItemIds={selectedItemIds}
              onToggleSelection={handleToggleSelection}
              onCopySelected={(includeMeals) => handleCopyForAi('selected', includeMeals)}
              onClearSelection={() => setSelectedItemIds(new Set())}
            />
          ) : (
            <InventoryView
              items={items}
              categories={categories}
              activeCategoryId={activeCategoryId}
              activities={activities}
              incrementStock={incrementStock}
              decrementStock={decrementStock}
              openItem={openItem}
              unopenItem={unopenItem}
              archiveItem={archiveItem}
              updateRemainingAmount={updateRemainingAmount}
              handleDeleteItem={handleDeleteItem}
              handleEditItem={handleEditItem}
              handleDuplicateItem={handleDuplicateItem}
              deleteActivity={deleteActivity}
              updateActivity={updateActivity}
              clearActivities={clearActivities}
              setIsAddModalOpen={setIsAddModalOpen}
              showFloatingAddButton={false}
            />
          )}
        </div>
      </main>

      {/* Copy Toast */}
      {showCopyToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 backdrop-blur-md">
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
            <p className="text-sm font-bold tracking-wide">クリップボードにコピーしました</p>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 z-40 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around h-16 px-4">
          <button
            onClick={() => {
              setActiveTab('stock');
              if (activeCategoryId === 'history') setActiveCategoryId(categories[0]?.id || CATEGORY_IDS.fresh);
            }}
            className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${
              activeTab === 'stock' ? 'text-gray-900' : 'text-gray-400'
            }`}
          >
            <Boxes className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold">在庫</span>
          </button>

          <button
            onClick={() => setActiveTab('selection')}
            className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${
              activeTab === 'selection' ? 'text-gray-900' : 'text-gray-400'
            }`}
          >
            <div className="relative">
              <Sparkles className="w-6 h-6 mb-1" />
              {selectedItemIds.size > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white">
                  {selectedItemIds.size}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold">選択</span>
          </button>

          {/* Center Add Button depending on Tab */}
          <div className="-mt-6">
            <button
              onClick={() => {
                if (activeTab === 'stock' || activeTab === 'selection') {
                  setIsAddModalOpen(true);
                } else {
                  setIsAddMealModalOpen(true);
                }
              }}
              className="bg-gray-900 text-white w-14 h-14 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all outline-none"
              aria-label={activeTab === 'stock' || activeTab === 'selection' ? 'アイテムを追加' : '献立を追加'}
            >
              <Plus className="w-7 h-7" />
            </button>
          </div>

          <button
            onClick={() => setActiveTab('meals')}
            className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${
              activeTab === 'meals' ? 'text-gray-900' : 'text-gray-400'
            }`}
          >
            <UtensilsCrossed className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold">献立</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <DeleteConfirmModal
        deleteConfirmState={deleteConfirmState}
        onCancel={() => setDeleteConfirmState(null)}
        onConfirm={handleConfirmDelete}
      />

      <AddMealModal 
        isOpen={isAddMealModalOpen}
        onClose={() => setIsAddMealModalOpen(false)}
        onAdd={handleAddMealLog}
      />

      <AddItemModal 
        isOpen={isAddModalOpen} 
        onClose={handleCloseAddModal} 
        categories={categories}
        items={items}
        onAdd={addItem}
        onEdit={updateItem}
        initialCategory={activeCategoryId}
        editItem={editingItem}
        isDuplicate={isDuplicateMode}
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
