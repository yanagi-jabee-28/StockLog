import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useInventory } from './hooks/useInventory';
import { useMealLog } from './hooks/useMealLog';
import { Sidebar } from './components/layout/Sidebar';
import { MobileHeader } from './components/layout/MobileHeader';
import { MealView } from './components/features/meals/MealView';
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
  
  const [activeTab, setActiveTab] = useState<'stock' | 'meals'>('stock');
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
        onSelectCategory={setActiveCategoryId}
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

      {/* Floating Action Button (Mobile Only) */}
      {showAddItemButton && (
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
