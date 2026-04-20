import { useState, useEffect, useCallback } from 'react';
import { InventoryItem, Category, ActivityEntry } from '../types';
import { storage } from '../lib/storage';

export function useInventory() {
  const [items, setItemsState] = useState<InventoryItem[]>([]);
  const [categories, setCategoriesState] = useState<Category[]>([]);
  const [activities, setActivitiesState] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    setItemsState(storage.getItems());
    setCategoriesState(storage.getCategories());
    setActivitiesState(storage.getActivities());
  }, []);

  const saveItems = useCallback((newItems: InventoryItem[]) => {
    setItemsState(newItems);
    storage.setItems(newItems);
  }, []);

  const refreshActivities = useCallback(() => {
    setActivitiesState(storage.getActivities());
  }, []);

  const addItem = useCallback((item: Omit<InventoryItem, 'id' | 'createdAt'>) => {
    const newItem = { 
      ...item, 
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    saveItems([...items, newItem]);
    storage.addActivity({
      itemId: newItem.id,
      itemName: newItem.name,
      type: 'added',
      details: `${newItem.stock}${newItem.unit} 追加`
    });
    refreshActivities();
  }, [items, saveItems, refreshActivities]);

  const updateItem = useCallback((id: string, updates: Partial<InventoryItem>) => {
    const target = items.find(i => i.id === id);
    if (!target) return;

    const originalId = target.isOpened ? target.originalItemId : target.id;
    
    console.log(`[UPDATE_SYNC] Updating item group for: ${target.name}`, updates);

    const newItems = items.map(item => {
      // 1. Match the direct target
      if (item.id === id) return { ...item, ...updates };

      // 2. Sync linked items (Only sync non-instance fields)
      // We don't want to sync 'isOpened' or 'remainingPercent' back to original
      const syncableUpdates = { ...updates };
      delete syncableUpdates.isOpened;
      delete syncableUpdates.remainingPercent;
      delete syncableUpdates.remainingAmount;
      delete syncableUpdates.id;

      if (originalId && (item.id === originalId || item.originalItemId === originalId)) {
        return { ...item, ...syncableUpdates };
      }

      if (!target.isOpened && item.originalItemId === id) {
        return { ...item, ...syncableUpdates };
      }

      return item;
    });

    saveItems(newItems);
    
    // Log as edit if not just a remaining update via sync
    const keys = Object.keys(updates);
    if (keys.length > 0 && !keys.every(k => ['remainingAmount', 'remainingPercent'].includes(k))) {
      storage.addActivity({
        itemId: id,
        itemName: target.name,
        type: 'edited',
        details: '項目情報を更新'
      });
      refreshActivities();
    }
  }, [items, saveItems, refreshActivities]);

  const incrementStock = useCallback((id: string) => {
    const target = items.find(i => i.id === id);
    if (!target) return;
    
    const newStock = target.stock + 1;
    const originalId = target.isOpened ? target.originalItemId : target.id;

    console.log(`[STOCK_SYNC] Incrementing stock for ${target.name}. New total: ${newStock}`);

    const newItems = items.map(item => {
      // 1. Direct match
      if (item.id === id) return { ...item, stock: newStock };
      
      // 2. If target is opened, sync original and all other clones
      if (originalId && (item.id === originalId || item.originalItemId === originalId)) {
        return { ...item, stock: newStock };
      }
      
      // 3. If target is original, sync all clones
      if (!target.isOpened && item.originalItemId === id) {
        return { ...item, stock: newStock };
      }
      
      return item;
    });
    saveItems(newItems);
    storage.addActivity({
      itemId: id,
      itemName: target.name,
      type: 'stock_up',
      details: `ストック追加: ${target.stock} → ${newStock} ${target.unit}`
    });
    refreshActivities();
  }, [items, saveItems, refreshActivities]);

  const decrementStock = useCallback((id: string) => {
    const target = items.find(i => i.id === id);
    if (!target || target.stock <= 0) return;
    
    const newStock = Math.max(0, target.stock - 1);
    const originalId = target.isOpened ? target.originalItemId : target.id;

    console.log(`[STOCK_SYNC] Decrementing stock for ${target.name}. New total: ${newStock}`);

    const newItems = items.map(item => {
      // 1. Direct match
      if (item.id === id) return { ...item, stock: newStock };
      
      // 2. Sync group logic
      if (originalId && (item.id === originalId || item.originalItemId === originalId)) {
        return { ...item, stock: newStock };
      }

      if (!target.isOpened && item.originalItemId === id) {
        return { ...item, stock: newStock };
      }
      
      return item;
    });
    saveItems(newItems);
    storage.addActivity({
      itemId: id,
      itemName: target.name,
      type: 'stock_down',
      details: `ストック減少: ${target.stock} → ${newStock} ${target.unit}`
    });
    refreshActivities();
  }, [items, saveItems, refreshActivities]);

  const deleteItem = useCallback((id: string) => {
    const target = items.find(i => i.id === id);
    const newItems = items.filter(item => item.id !== id);
    saveItems(newItems);
    if (target) {
      storage.addActivity({
        itemId: id,
        itemName: target.name,
        type: 'deleted',
        details: 'アイテムを削除'
      });
      refreshActivities();
    }
  }, [items, saveItems, refreshActivities]);

  const openItem = useCallback((id: string) => {
    const sourceItem = items.find(i => i.id === id);
    if (!sourceItem || sourceItem.stock <= 0) return;
    
    const newStock = sourceItem.stock - 1;
    
    // 1. Update existing items in the pool
    const updatedPool = items.map(item => {
      if (item.id === id || item.originalItemId === id) {
        return { ...item, stock: newStock };
      }
      return item;
    });

    // 2. Create a NEW unique item instance for the "Opened" version
    const openedItem: InventoryItem = {
      ...sourceItem,
      id: crypto.randomUUID(), 
      stock: newStock, // Ensure consistency from the start
      isOpened: true,
      categoryId: ['daily', 'stationery', 'med_cosme', 'hobby'].includes(sourceItem.categoryId) ? 'priority_daily' : 'priority',
      remainingAmount: '100',
      remainingPercent: 100,
      originalItemId: sourceItem.id
    };

    saveItems([...updatedPool, openedItem]);
    storage.addActivity({
      itemId: id,
      itemName: sourceItem.name,
      type: 'opened',
      details: `開封して使用開始 (ストック: ${sourceItem.stock} → ${newStock})`
    });
    refreshActivities();
  }, [items, saveItems, refreshActivities]);

  const updateRemainingAmount = useCallback((id: string, amount: string) => {
    const target = items.find(i => i.id === id);
    if (!target) return;

    const percent = parseInt(amount);
    const newPercent = isNaN(percent) ? 100 : percent;
    
    updateItem(id, { 
      remainingAmount: amount,
      remainingPercent: newPercent
    });

    // Throttled logging for remaining amount to avoid spam
    if (Math.abs((target.remainingPercent || 100) - newPercent) >= 10) {
      storage.addActivity({
        itemId: id,
        itemName: target.name,
        type: 'remaining_update',
        details: `残量変化: ${target.remainingPercent}% → ${newPercent}%`
      });
      refreshActivities();
    }
  }, [items, updateItem, refreshActivities]);

  const unopenItem = useCallback((id: string) => {
    const target = items.find(i => i.id === id);
    if (!target || !target.isOpened || !target.originalItemId) return;
    
    const originalItem = items.find(i => i.id === target.originalItemId);
    const newStock = (originalItem?.stock ?? target.stock) + 1;

    // 1. Update original and other clones
    const updatedPool = items.filter(item => item.id !== id).map(item => {
      if (item.id === target.originalItemId || item.originalItemId === target.originalItemId) {
        return { ...item, stock: newStock };
      }
      return item;
    });

    saveItems(updatedPool);
    storage.addActivity({
      itemId: target.originalItemId,
      itemName: target.name,
      type: 'stock_up',
      details: `開封の取り消し (使用中アイテムをストックに戻しました)`
    });
    refreshActivities();
  }, [items, saveItems, refreshActivities]);

  const archiveItem = useCallback((id: string) => {
    const target = items.find(i => i.id === id);
    updateItem(id, { isArchived: true, archivedAt: new Date().toISOString() });
    if (target) {
      storage.addActivity({
        itemId: id,
        itemName: target.name,
        type: 'archived',
        details: '使い切り完了・アーカイブ'
      });
      refreshActivities();
    }
  }, [items, updateItem, refreshActivities]);

  const clearActivities = useCallback(() => {
    storage.clearActivities();
    refreshActivities();
  }, [refreshActivities]);

  const deleteActivity = useCallback((id: string) => {
    storage.deleteActivity(id);
    refreshActivities();
  }, [refreshActivities]);

  const updateActivity = useCallback((id: string, updates: Partial<ActivityEntry>) => {
    storage.updateActivity(id, updates);
    refreshActivities();
  }, [refreshActivities]);

  const reloadData = useCallback(() => {
    setItemsState(storage.getItems());
    setCategoriesState(storage.getCategories());
    setActivitiesState(storage.getActivities());
  }, []);

  return {
    items,
    categories,
    activities,
    addItem,
    updateItem,
    incrementStock,
    decrementStock,
    deleteItem,
    openItem,
    unopenItem,
    updateRemainingAmount,
    archiveItem,
    deleteActivity,
    updateActivity,
    clearActivities,
    reloadData
  };
}

