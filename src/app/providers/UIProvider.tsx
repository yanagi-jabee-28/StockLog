import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { InventoryItem, Category, MealLog } from '../../shared/types';
import { CATEGORY_IDS } from '../../constants';
import { formatForAi, copyToClipboard } from '../../shared/lib/clipboard';
import { useData } from './DataProvider';

interface UIContextType {
  activeTab: 'stock' | 'selection' | 'meals';
  setActiveTab: (tab: 'stock' | 'selection' | 'meals') => void;
  activeCategoryId: string;
  setActiveCategoryId: (id: string) => void;
  editingItem: InventoryItem | null;
  setEditingItem: (item: InventoryItem | null) => void;
  editingMeal: MealLog | null;
  setEditingMeal: (meal: MealLog | null) => void;
  isDuplicateMode: boolean;
  setIsDuplicateMode: (mode: boolean) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  isAddMealModalOpen: boolean;
  setIsAddMealModalOpen: (open: boolean) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;
  isCategoryPickerOpen: boolean;
  setIsCategoryPickerOpen: (open: boolean) => void;
  deleteConfirmState: {
    item: InventoryItem;
    linkedOpenedCount: number;
  } | null;
  setDeleteConfirmState: (state: { item: InventoryItem; linkedOpenedCount: number } | null) => void;
  selectedItemIds: Set<string>;
  setSelectedItemIds: (ids: Set<string>) => void;
  isSelectionMode: boolean;
  setIsSelectionMode: (mode: boolean) => void;
  showCopyToast: boolean;
  setShowCopyToast: (show: boolean) => void;
  initialAddItemValues: Partial<Omit<InventoryItem, 'id' | 'createdAt'>> | null;
  setInitialAddItemValues: (values: Partial<Omit<InventoryItem, 'id' | 'createdAt'>> | null) => void;
  
  // Handlers
  handleEditItem: (item: InventoryItem) => void;
  handleDuplicateItem: (item: InventoryItem) => void;
  handleRegisterPrepFromMeal: (meal: MealLog) => void;
  handleDeleteItem: (id: string) => void;
  handleConfirmDelete: () => void;
  handleCloseAddModal: () => void;
  handleAddMealLog: (mealData: { date: number; name: string; ingredients: string[]; notes: string }) => void;
  handleEditMeal: (meal: MealLog) => void;
  handleUpdateMealLog: (id: string, mealData: Partial<MealLog>) => void;
  handleCloseMealModal: () => void;
  handleToggleSelection: (id: string) => void;
  handleCopyForAi: (type: 'selected' | 'all' | 'meals', includeMeals?: boolean) => Promise<void>;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const { items, categories, mealLogs, inventory, meals } = useData();

  const [activeTab, setActiveTab] = useState<'stock' | 'selection' | 'meals'>('stock');
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id || CATEGORY_IDS.fresh);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editingMeal, setEditingMeal] = useState<MealLog | null>(null);
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
  const [initialAddItemValues, setInitialAddItemValues] = useState<Partial<Omit<InventoryItem, 'id' | 'createdAt'>> | null>(null);

  const handleEditItem = useCallback((item: InventoryItem) => {
    setIsDuplicateMode(false);
    setEditingItem(item);
    setInitialAddItemValues(null);
    setIsAddModalOpen(true);
  }, []);

  const handleDuplicateItem = useCallback((item: InventoryItem) => {
    setIsDuplicateMode(true);
    setEditingItem(item); 
    setInitialAddItemValues(null);
    setIsAddModalOpen(true);
  }, []);

  const handleRegisterPrepFromMeal = useCallback((meal: MealLog) => {
    setIsDuplicateMode(false);
    setEditingItem(null);
    setInitialAddItemValues({
      name: meal.name,
      categoryId: CATEGORY_IDS.prep,
      stock: 1,
      notes: meal.ingredients.length > 0 
        ? `【使用食材】\n${meal.ingredients.join('、')}${meal.notes ? `\n\n【備考】\n${meal.notes}` : ''}`
        : meal.notes || undefined,
    });
    setIsAddModalOpen(true);
  }, []);

  const handleDeleteItem = useCallback((id: string) => {
    const target = items.find(item => item.id === id);
    if (!target) return;

    const linkedOpenedCount = target.isOpened
      ? 0
      : items.filter(item => item.isOpened && item.originalItemId === id).length;

    setDeleteConfirmState({
      item: target,
      linkedOpenedCount,
    });
  }, [items]);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteConfirmState) return;
    inventory.deleteItem(deleteConfirmState.item.id);
    setDeleteConfirmState(null);
  }, [deleteConfirmState, inventory]);

  const handleCloseAddModal = useCallback(() => {
    setIsAddModalOpen(false);
    setEditingItem(null);
    setInitialAddItemValues(null);
    setIsDuplicateMode(false);
  }, []);

  const handleAddMealLog = useCallback((mealData: { date: number; name: string; ingredients: string[]; notes: string }) => {
    meals.addMealLog(mealData);
    setIsAddMealModalOpen(false);
  }, [meals]);

  const handleEditMeal = useCallback((meal: MealLog) => {
    setEditingMeal(meal);
    setIsAddMealModalOpen(true);
  }, []);

  const handleUpdateMealLog = useCallback((id: string, mealData: Partial<MealLog>) => {
    meals.updateMealLog(id, mealData);
    setIsAddMealModalOpen(false);
    setEditingMeal(null);
  }, [meals]);

  const handleCloseMealModal = useCallback(() => {
    setIsAddMealModalOpen(false);
    setEditingMeal(null);
  }, []);

  const handleToggleSelection = useCallback((id: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleCopyForAi = useCallback(async (type: 'selected' | 'all' | 'meals', includeMealsInSelection: boolean = false) => {
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
  }, [items, categories, mealLogs, selectedItemIds]);

  // Sync category selection
  useEffect(() => {
    if (categories.length === 0) return;
    if (activeCategoryId === 'history') return;

    const isValidCategory = categories.some((category) => category.id === activeCategoryId);
    if (!isValidCategory) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories, activeCategoryId]);

  const value: UIContextType = {
    activeTab,
    setActiveTab,
    activeCategoryId,
    setActiveCategoryId,
    editingItem,
    setEditingItem,
    editingMeal,
    setEditingMeal,
    isDuplicateMode,
    setIsDuplicateMode,
    isAddModalOpen,
    setIsAddModalOpen,
    isAddMealModalOpen,
    setIsAddMealModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    isCategoryPickerOpen,
    setIsCategoryPickerOpen,
    deleteConfirmState,
    setDeleteConfirmState,
    selectedItemIds,
    setSelectedItemIds,
    isSelectionMode,
    setIsSelectionMode,
    showCopyToast,
    setShowCopyToast,
    initialAddItemValues,
    setInitialAddItemValues,
    handleEditItem,
    handleDuplicateItem,
    handleRegisterPrepFromMeal,
    handleDeleteItem,
    handleConfirmDelete,
    handleCloseAddModal,
    handleAddMealLog,
    handleEditMeal,
    handleUpdateMealLog,
    handleCloseMealModal,
    handleToggleSelection,
    handleCopyForAi,
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
