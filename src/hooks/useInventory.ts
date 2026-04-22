import { useState, useEffect, useCallback } from 'react';
import { InventoryItem, Category, ActivityEntry } from '../types';
import { storage } from '../lib/storage';
import {
  setRootStockOnly,
  setStockForGroupByTarget,
  updateItemWithGroupSync,
} from '../lib/itemSync';
import { buildPriceHistoryEntry, normalizePriceItem } from '../lib/price';

const withPriceMetadata = (item: InventoryItem): InventoryItem => normalizePriceItem(item);

const appendPriceHistoryIfNeeded = (
  currentItem: InventoryItem,
  updates: Partial<InventoryItem>
): Partial<InventoryItem> => {
  const priceFieldsChanged = [
    'purchasePrice',
    'contentAmount',
    'contentUnit',
    'pricePerUnit',
  ].some(key => key in updates);

  if (!priceFieldsChanged) {
    return updates;
  }

  const priceHistory = currentItem.priceHistory ? [...currentItem.priceHistory] : [];
  const entry = buildPriceHistoryEntry({
    createdAt: currentItem.createdAt,
    notes: updates.notes ?? currentItem.notes,
    purchasePrice: updates.purchasePrice ?? currentItem.purchasePrice,
    contentAmount: updates.contentAmount ?? currentItem.contentAmount,
    contentUnit: updates.contentUnit ?? currentItem.contentUnit,
    pricePerUnit: updates.pricePerUnit ?? currentItem.pricePerUnit,
    priceNotes: typeof updates.notes === 'string' ? updates.notes : undefined,
  });

  if (!entry) {
    return updates;
  }

  return {
    ...updates,
    priceHistory: [entry, ...priceHistory],
  };
};

export function useInventory() {
  const [items, setItemsState] = useState<InventoryItem[]>([]);
  const [categories, setCategoriesState] = useState<Category[]>([]);
  const [activities, setActivitiesState] = useState<ActivityEntry[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    setItemsState(storage.getItems().map(withPriceMetadata));
    setCategoriesState(storage.getCategories());
    setActivitiesState(storage.getActivities());
    setUpdatedAt(storage.getUpdatedAt());
  }, []);

  const saveItems = useCallback((newItems: InventoryItem[]) => {
    setItemsState(newItems);
    storage.setItems(newItems);
    setUpdatedAt(storage.getUpdatedAt());
  }, []);

  const refreshActivities = useCallback(() => {
    setActivitiesState(storage.getActivities());
    setUpdatedAt(storage.getUpdatedAt());
  }, []);

  const addItem = useCallback((item: Omit<InventoryItem, 'id' | 'createdAt'>) => {
    const newItem = { 
      ...item, 
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    saveItems([...items, withPriceMetadata(newItem)]);
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
    
    const priceAwareUpdates = appendPriceHistoryIfNeeded(target, updates);
    const newItems = updateItemWithGroupSync(items, id, priceAwareUpdates);

    saveItems(newItems.map(withPriceMetadata));
    
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
    if (!target || target.isOpened) return;
    
    const newStock = target.stock + 1;

    const newItems = setStockForGroupByTarget(items, id, newStock);
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
    if (!target || target.isOpened || target.stock <= 0) return;
    
    const newStock = Math.max(0, target.stock - 1);

    const newItems = setStockForGroupByTarget(items, id, newStock);
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
    if (!target) return;

    const linkedOpenedItems = target.isOpened
      ? []
      : items.filter(item => item.isOpened && item.originalItemId === id);

    const linkedOpenedIds = new Set(linkedOpenedItems.map(item => item.id));
    const newItems = items.filter(item => item.id !== id && !linkedOpenedIds.has(item.id));

    saveItems(newItems);

    storage.addActivity({
      itemId: id,
      itemName: target.name,
      type: 'deleted',
      details: linkedOpenedItems.length > 0
        ? `アイテムを削除（開封中 ${linkedOpenedItems.length} 件も連鎖削除）`
        : 'アイテムを削除'
    });

    for (const opened of linkedOpenedItems) {
      storage.addActivity({
        itemId: opened.id,
        itemName: opened.name,
        type: 'deleted',
        details: `親ロット削除に伴い開封個体を削除（親ID: ${id}）`
      });
    }

    refreshActivities();
  }, [items, saveItems, refreshActivities]);

  const openItem = useCallback((id: string) => {
    const sourceItem = items.find(i => i.id === id);
    if (!sourceItem || sourceItem.isOpened || sourceItem.stock <= 0) return;
    
    const newStock = sourceItem.stock - 1;
    const updatedPool = setStockForGroupByTarget(items, id, newStock);

    // 2. Create a NEW unique item instance for the "Opened" version
    const openedItem: InventoryItem = {
      ...sourceItem,
      id: crypto.randomUUID(), 
      stock: 1,
      isOpened: true,
      categoryId: sourceItem.categoryId,
      remainingAmount: '100',
      remainingPercent: 100,
      originalItemId: sourceItem.id
    };

    saveItems([...updatedPool, withPriceMetadata(openedItem)]);
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
    
    const originalItem = items.find(i => i.id === target.originalItemId && !i.isOpened);

    if (!originalItem) {
      const orphanRemoved = items.filter(item => item.id !== id);
      saveItems(orphanRemoved);
      storage.addActivity({
        itemId: id,
        itemName: target.name,
        type: 'deleted',
        details: '整合性修復: 親ロット不在の開封個体を削除'
      });
      refreshActivities();
      return;
    }

    const newStock = originalItem.stock + 1;
    const itemPool = items.filter(item => item.id !== id);
    const updatedPool = setRootStockOnly(itemPool, target.originalItemId, newStock);

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
    setItemsState(storage.getItems().map(withPriceMetadata));
    setCategoriesState(storage.getCategories());
    setActivitiesState(storage.getActivities());
    setUpdatedAt(storage.getUpdatedAt());
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
    ,
    updatedAt
  };
}

