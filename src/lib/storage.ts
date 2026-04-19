import { Category, InventoryItem } from '../types';

const STORAGE_KEY_ITEMS = 'stocklog_items';
const STORAGE_KEY_CATEGORIES = 'stocklog_categories';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'priority', name: '🚨 早めに消費（開封済・生物）' },
  { id: 'grocery', name: '🛒 生鮮・買い出し品' },
  { id: 'prepped', name: '🍱 作り置き・お弁当' },
  { id: 'frozen', name: '❄️ 冷凍・ストック' },
  { id: 'pantry', name: '🧂 調味料・乾物' },
  { id: 'daily', name: '🧻 日用品・消耗品' },
];

export const storage = {
  getItems: (): InventoryItem[] => {
    const data = localStorage.getItem(STORAGE_KEY_ITEMS);
    return data ? JSON.parse(data) : [];
  },

  setItems: (items: InventoryItem[]): void => {
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
  },

  getCategories: (): Category[] => {
    const data = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
  },

  setCategories: (categories: Category[]): void => {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
  },

  exportData: (): string => {
    const data = {
      items: storage.getItems(),
      categories: storage.getCategories(),
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  },

  importData: (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.items && Array.isArray(data.items)) {
        storage.setItems(data.items);
      }
      if (data.categories && Array.isArray(data.categories)) {
        storage.setCategories(data.categories);
      }
      return true;
    } catch (e) {
      console.error('Failed to parse import data', e);
      return false;
    }
  }
};
