import React, { createContext, useContext, ReactNode } from 'react';
import { useInventory } from '../../entities/inventory/lib/useInventory';
import { useMealLog } from '../../entities/meal/lib/useMealLog';
import { InventoryItem, Category, ActivityEntry, MealLog } from '../../shared/types';

interface DataContextType {
  items: InventoryItem[];
  categories: Category[];
  activities: ActivityEntry[];
  mealLogs: MealLog[];
  inventory: ReturnType<typeof useInventory>;
  meals: ReturnType<typeof useMealLog>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const inventory = useInventory();
  const meals = useMealLog();

  const value: DataContextType = {
    items: inventory.items,
    categories: inventory.categories,
    activities: inventory.activities,
    mealLogs: meals.mealLogs,
    inventory,
    meals,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
