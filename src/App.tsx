import React from 'react';
import { Sidebar } from './shared/ui/layout/Sidebar';
import { MobileHeader } from './shared/ui/layout/MobileHeader';
import { MealView } from './features/log-meal/ui/MealView';
import { SelectionView } from './features/ai-selection/ui/SelectionView';
import { InventoryView } from './features/inventory/ui/InventoryView';
import { AddItemModal } from './features/add-item/ui/AddItemModal';
import { SettingsModal } from './features/settings/ui/SettingsModal';
import { AddMealModal } from './features/log-meal/ui/AddMealModal';
import { CategoryPickerModal } from './features/inventory/ui/CategoryPickerModal';
import { DeleteConfirmModal } from './features/inventory/ui/DeleteConfirmModal';
import { useModalNavigation } from './shared/lib/hooks/useModalNavigation';
import { BottomNavigation } from './shared/ui/layout/BottomNavigation';
import { CopyToast } from './shared/ui/layout/CopyToast';
import { useData } from './app/providers/DataProvider';
import { useUI } from './app/providers/UIProvider';

export default function App() {
  const { items, categories, inventory, meals, activities, mealLogs } = useData();
  const ui = useUI();

  useModalNavigation(!!ui.deleteConfirmState, () => ui.setDeleteConfirmState(null), 'delete-confirm-modal');
  useModalNavigation(ui.isCategoryPickerOpen, () => ui.setIsCategoryPickerOpen(false), 'category-picker-modal');

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#f8f9fa] text-gray-900 overflow-hidden font-sans xl:max-w-[1400px] xl:mx-auto xl:shadow-[0_0_80px_rgba(0,0,0,0.05)] xl:my-6 xl:h-[calc(100vh-3rem)] xl:rounded-[2.5rem] border-gray-100">
      <Sidebar
        categories={categories}
        items={items}
        activeTab={ui.activeTab}
        activeCategoryId={ui.activeCategoryId}
        setActiveTab={ui.setActiveTab}
        setActiveCategoryId={ui.setActiveCategoryId}
        setIsCategoryPickerOpen={ui.setIsCategoryPickerOpen}
        setIsSettingsModalOpen={ui.setIsSettingsModalOpen}
      />

      <MobileHeader
        categories={categories}
        activeTab={ui.activeTab}
        activeCategoryId={ui.activeCategoryId}
        setActiveTab={ui.setActiveTab}
        setActiveCategoryId={ui.setActiveCategoryId}
        setIsCategoryPickerOpen={ui.setIsCategoryPickerOpen}
        setIsSettingsModalOpen={ui.setIsSettingsModalOpen}
      />

      <CategoryPickerModal
        isOpen={ui.isCategoryPickerOpen}
        categories={categories}
        activeCategoryId={ui.activeCategoryId}
        onSelectCategory={(categoryId) => {
          ui.setActiveTab('stock');
          ui.setActiveCategoryId(categoryId);
        }}
        onClose={() => ui.setIsCategoryPickerOpen(false)}
      />

      <main className="flex-1 flex flex-col items-center bg-[#fbfbfc] overflow-y-auto relative z-0">
        <div className="w-full max-w-6xl px-4 py-6 md:p-12 shrink-0 mb-28 md:mb-0">
          {ui.activeTab === 'meals' ? (
            <MealView 
              mealLogs={mealLogs}
              setIsAddMealModalOpen={ui.setIsAddMealModalOpen}
              deleteMealLog={meals.deleteMealLog}
            />
          ) : ui.activeTab === 'selection' ? (
            <SelectionView
              items={items}
              categories={categories}
              mealLogs={mealLogs}
              selectedItemIds={ui.selectedItemIds}
              onToggleSelection={ui.handleToggleSelection}
              onCopySelected={(includeMeals) => ui.handleCopyForAi('selected', includeMeals)}
              onClearSelection={() => ui.setSelectedItemIds(new Set())}
            />
          ) : (
            <InventoryView
              items={items}
              categories={categories}
              activeCategoryId={ui.activeCategoryId}
              activities={activities}
              incrementStock={inventory.incrementStock}
              decrementStock={inventory.decrementStock}
              openItem={inventory.openItem}
              unopenItem={inventory.unopenItem}
              archiveItem={inventory.archiveItem}
              updateRemainingAmount={inventory.updateRemainingAmount}
              handleDeleteItem={ui.handleDeleteItem}
              handleEditItem={ui.handleEditItem}
              handleDuplicateItem={ui.handleDuplicateItem}
              deleteActivity={inventory.deleteActivity}
              updateActivity={inventory.updateActivity}
              clearActivities={inventory.clearActivities}
              setIsAddModalOpen={ui.setIsAddModalOpen}
              showFloatingAddButton={false}
            />
          )}
        </div>
      </main>

      <CopyToast show={ui.showCopyToast} />

      <BottomNavigation
        activeTab={ui.activeTab}
        activeCategoryId={ui.activeCategoryId}
        categories={categories}
        selectedItemCount={ui.selectedItemIds.size}
        onTabChange={ui.setActiveTab}
        onCategoryIdChange={ui.setActiveCategoryId}
        onAddClick={() => {
          if (ui.activeTab === 'stock' || ui.activeTab === 'selection') {
            ui.setIsAddModalOpen(true);
          } else {
            ui.setIsAddMealModalOpen(true);
          }
        }}
      />

      <DeleteConfirmModal
        deleteConfirmState={ui.deleteConfirmState}
        onCancel={() => ui.setDeleteConfirmState(null)}
        onConfirm={ui.handleConfirmDelete}
      />

      <AddMealModal 
        isOpen={ui.isAddMealModalOpen}
        onClose={() => ui.setIsAddMealModalOpen(false)}
        onAdd={ui.handleAddMealLog}
      />

      <AddItemModal 
        isOpen={ui.isAddModalOpen} 
        onClose={ui.handleCloseAddModal} 
        categories={categories}
        items={items}
        onAdd={inventory.addItem}
        onEdit={inventory.updateItem}
        initialCategory={ui.activeCategoryId}
        editItem={ui.editingItem}
        isDuplicate={ui.isDuplicateMode}
      />
      
      <SettingsModal 
        isOpen={ui.isSettingsModalOpen}
        onClose={() => ui.setIsSettingsModalOpen(false)}
        onDataImported={inventory.reloadData}
      />
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
