import React from 'react';
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
import { useModalNavigation } from './hooks/useModalNavigation';
import { useAppLogic } from './hooks/useAppLogic';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { CopyToast } from './components/layout/CopyToast';

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

  const { state, actions } = useAppLogic({
    items,
    categories,
    mealLogs,
    deleteItem,
    addMealLog,
    reloadData,
  });

  useModalNavigation(!!state.deleteConfirmState, () => actions.setDeleteConfirmState(null), 'delete-confirm-modal');
  useModalNavigation(state.isCategoryPickerOpen, () => actions.setIsCategoryPickerOpen(false), 'category-picker-modal');

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#f8f9fa] text-gray-900 overflow-hidden font-sans xl:max-w-[1400px] xl:mx-auto xl:shadow-[0_0_80px_rgba(0,0,0,0.05)] xl:my-6 xl:h-[calc(100vh-3rem)] xl:rounded-[2.5rem] border-gray-100">
      <Sidebar
        categories={categories}
        items={items}
        activeTab={state.activeTab}
        activeCategoryId={state.activeCategoryId}
        setActiveTab={actions.setActiveTab}
        setActiveCategoryId={actions.setActiveCategoryId}
        setIsCategoryPickerOpen={actions.setIsCategoryPickerOpen}
        setIsSettingsModalOpen={actions.setIsSettingsModalOpen}
      />

      <MobileHeader
        categories={categories}
        activeTab={state.activeTab}
        activeCategoryId={state.activeCategoryId}
        setActiveTab={actions.setActiveTab}
        setActiveCategoryId={actions.setActiveCategoryId}
        setIsCategoryPickerOpen={actions.setIsCategoryPickerOpen}
        setIsSettingsModalOpen={actions.setIsSettingsModalOpen}
      />

      <CategoryPickerModal
        isOpen={state.isCategoryPickerOpen}
        categories={categories}
        activeCategoryId={state.activeCategoryId}
        onSelectCategory={(categoryId) => {
          actions.setActiveTab('stock');
          actions.setActiveCategoryId(categoryId);
        }}
        onClose={() => actions.setIsCategoryPickerOpen(false)}
      />

      <main className="flex-1 flex flex-col items-center bg-[#fbfbfc] overflow-y-auto relative z-0">
        <div className="w-full max-w-6xl px-4 py-6 md:p-12 shrink-0 mb-28 md:mb-0">
          {state.activeTab === 'meals' ? (
            <MealView 
              mealLogs={mealLogs}
              setIsAddMealModalOpen={actions.setIsAddMealModalOpen}
              deleteMealLog={deleteMealLog}
            />
          ) : state.activeTab === 'selection' ? (
            <SelectionView
              items={items}
              categories={categories}
              mealLogs={mealLogs}
              selectedItemIds={state.selectedItemIds}
              onToggleSelection={actions.handleToggleSelection}
              onCopySelected={(includeMeals) => actions.handleCopyForAi('selected', includeMeals)}
              onClearSelection={() => actions.setSelectedItemIds(new Set())}
            />
          ) : (
            <InventoryView
              items={items}
              categories={categories}
              activeCategoryId={state.activeCategoryId}
              activities={activities}
              incrementStock={incrementStock}
              decrementStock={decrementStock}
              openItem={openItem}
              unopenItem={unopenItem}
              archiveItem={archiveItem}
              updateRemainingAmount={updateRemainingAmount}
              handleDeleteItem={actions.handleDeleteItem}
              handleEditItem={actions.handleEditItem}
              handleDuplicateItem={actions.handleDuplicateItem}
              deleteActivity={deleteActivity}
              updateActivity={updateActivity}
              clearActivities={clearActivities}
              setIsAddModalOpen={actions.setIsAddModalOpen}
              showFloatingAddButton={false}
            />
          )}
        </div>
      </main>

      <CopyToast show={state.showCopyToast} />

      <BottomNavigation
        activeTab={state.activeTab}
        activeCategoryId={state.activeCategoryId}
        categories={categories}
        selectedItemCount={state.selectedItemIds.size}
        onTabChange={actions.setActiveTab}
        onCategoryIdChange={actions.setActiveCategoryId}
        onAddClick={() => {
          if (state.activeTab === 'stock' || state.activeTab === 'selection') {
            actions.setIsAddModalOpen(true);
          } else {
            actions.setIsAddMealModalOpen(true);
          }
        }}
      />

      <DeleteConfirmModal
        deleteConfirmState={state.deleteConfirmState}
        onCancel={() => actions.setDeleteConfirmState(null)}
        onConfirm={actions.handleConfirmDelete}
      />

      <AddMealModal 
        isOpen={state.isAddMealModalOpen}
        onClose={() => actions.setIsAddMealModalOpen(false)}
        onAdd={actions.handleAddMealLog}
      />

      <AddItemModal 
        isOpen={state.isAddModalOpen} 
        onClose={actions.handleCloseAddModal} 
        categories={categories}
        items={items}
        onAdd={addItem}
        onEdit={updateItem}
        initialCategory={state.activeCategoryId}
        editItem={state.editingItem}
        isDuplicate={state.isDuplicateMode}
      />
      
      <SettingsModal 
        isOpen={state.isSettingsModalOpen}
        onClose={() => actions.setIsSettingsModalOpen(false)}
        onDataImported={reloadData}
      />
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
