import { useState, useEffect, useCallback } from 'react';
import { InventoryItem, Category } from '../types';
import { storage } from '../lib/storage';

export function useInventory() {
  const [items, setItemsState] = useState<InventoryItem[]>([]);
  const [categories, setCategoriesState] = useState<Category[]>([]);

  useEffect(() => {
    setItemsState(storage.getItems());
    setCategoriesState(storage.getCategories());
  }, []);

  const saveItems = useCallback((newItems: InventoryItem[]) => {
    setItemsState(newItems);
    storage.setItems(newItems);
  }, []);

  const addItem = useCallback((item: Omit<InventoryItem, 'id'>) => {
    const newItem = { ...item, id: crypto.randomUUID() };
    saveItems([...items, newItem]);
  }, [items, saveItems]);

  const updateItem = useCallback((id: string, updates: Partial<InventoryItem>) => {
    const newItems = items.map(item => item.id === id ? { ...item, ...updates } : item);
    saveItems(newItems);
  }, [items, saveItems]);

  const incrementStock = useCallback((id: string) => {
    updateItem(id, { stock: items.find(i => i.id === id)!.stock + 1 });
  }, [items, updateItem]);

  const decrementStock = useCallback((id: string) => {
    const current = items.find(i => i.id === id)!.stock;
    if (current > 0) {
      updateItem(id, { stock: current - 1 });
    }
  }, [items, updateItem]);

  const deleteItem = useCallback((id: string) => {
    const newItems = items.filter(item => item.id !== id);
    saveItems(newItems);
  }, [items, saveItems]);

  const openItem = useCallback((id: string) => {
    const sourceItem = items.find(i => i.id === id);
    if (!sourceItem || sourceItem.stock <= 0) return;
    
    // 1. Decrement stock of the source item
    const updatedSourceItems = items.map(item => 
      item.id === id ? { ...item, stock: item.stock - 1 } : item
    );

    // 2. Create a NEW unique item instance for the "Opened" version
    // This ensures every opened item is tracked individually
    const openedItem: InventoryItem = {
      ...sourceItem,
      id: crypto.randomUUID(), // NEW UNIQUE ID
      stock: 1, // Individual instance
      isOpened: true,
      categoryId: 'priority',
      remainingAmount: '100%',
      originalItemId: sourceItem.id
    };

    saveItems([...updatedSourceItems, openedItem]);
  }, [items, saveItems]);

  const updateRemainingAmount = useCallback((id: string, amount: string) => {
    updateItem(id, { remainingAmount: amount });
  }, [updateItem]);

  const reloadData = useCallback(() => {
    setItemsState(storage.getItems());
    setCategoriesState(storage.getCategories());
  }, []);

  return {
    items,
    categories,
    addItem,
    updateItem,
    incrementStock,
    decrementStock,
    deleteItem,
    openItem,
    updateRemainingAmount,
    reloadData
  };
}
