import { useState, useEffect } from 'react';
import { InventoryItem, Category, MealLog } from '../types';
import { CATEGORY_IDS } from '../constants';
import { logInfo, logWarn, logError } from '../lib/logger';
import { formatForAi, copyToClipboard } from '../lib/clipboard';

interface UseAppLogicProps {
  items: InventoryItem[];
  categories: Category[];
  mealLogs: MealLog[];
  deleteItem: (id: string) => void;
  addMealLog: (mealData: { date: number; name: string; ingredients: string[]; notes: string }) => void;
  reloadData: () => void;
}

export function useAppLogic({
  items,
  categories,
  mealLogs,
  deleteItem,
  addMealLog,
  reloadData,
}: UseAppLogicProps) {
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

  const handleEditItem = (item: InventoryItem) => {
    setIsDuplicateMode(false);
    setEditingItem(item);
    setIsAddModalOpen(true);
  };

  const handleDuplicateItem = (item: InventoryItem) => {
    setIsDuplicateMode(true);
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

  return {
    state: {
      activeTab,
      activeCategoryId,
      editingItem,
      isDuplicateMode,
      isAddModalOpen,
      isAddMealModalOpen,
      isSettingsModalOpen,
      isCategoryPickerOpen,
      deleteConfirmState,
      selectedItemIds,
      isSelectionMode,
      showCopyToast,
    },
    actions: {
      setActiveTab,
      setActiveCategoryId,
      setIsAddModalOpen,
      setIsAddMealModalOpen,
      setIsSettingsModalOpen,
      setIsCategoryPickerOpen,
      setDeleteConfirmState,
      setIsSelectionMode,
      setSelectedItemIds,
      handleEditItem,
      handleDuplicateItem,
      handleDeleteItem,
      handleConfirmDelete,
      handleCloseAddModal,
      handleAddMealLog,
      handleToggleSelection,
      handleCopyForAi,
      setShowCopyToast,
    }
  };
}
