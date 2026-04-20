import { Category, InventoryItem, ActivityEntry } from '../types';

const STORAGE_KEY_ITEMS = 'stocklog_items';
const STORAGE_KEY_CATEGORIES = 'stocklog_categories';
const STORAGE_KEY_ACTIVITIES = 'stocklog_activities';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'priority', name: '🚨 開封済・食べ物' },
  { id: 'priority_daily', name: '🧼 使用中・消耗品' },
  { id: 'beverages', name: '🥤 飲料・ドリンク' },
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

  getActivities: (): ActivityEntry[] => {
    const data = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
    return data ? JSON.parse(data) : [];
  },

  addActivity: (activity: Omit<ActivityEntry, 'id' | 'timestamp'>): void => {
    const activities = storage.getActivities();
    const now = new Date();
    
    if (activity.type === 'remaining_update') {
      const lastActivity = activities[0];
      if (lastActivity && lastActivity.type === 'remaining_update' && lastActivity.itemId === activity.itemId) {
        const lastTime = new Date(lastActivity.timestamp);
        const diffMs = now.getTime() - lastTime.getTime();
        if (diffMs < 60 * 60 * 1000) {
          const startValueMatch = lastActivity.details?.match(/(\d+)%/);
          const endValueMatch = activity.details?.match(/→ (\d+)%/);
          if (startValueMatch && endValueMatch) {
            lastActivity.details = `残量変化: ${startValueMatch[1]}% → ${endValueMatch[1]}%`;
          } else {
            lastActivity.details = activity.details;
          }
          lastActivity.timestamp = now.toISOString();
          localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(activities));
          return;
        }
      }
    }

    const newActivity: ActivityEntry = {
      ...activity,
      id: crypto.randomUUID(),
      timestamp: now.toISOString()
    };
    const updatedActivities = [newActivity, ...activities].slice(0, 1000);
    localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(updatedActivities));
  },

  deleteActivity: (id: string): void => {
    const activities = storage.getActivities().filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(activities));
  },

  updateActivity: (id: string, updates: Partial<ActivityEntry>): void => {
    const activities = storage.getActivities().map(a => 
      a.id === id ? { ...a, ...updates } : a
    );
    localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(activities));
  },

  clearActivities: (): void => {
    localStorage.removeItem(STORAGE_KEY_ACTIVITIES);
  },

  exportData: (): string => {
    const data = {
      items: storage.getItems(),
      categories: storage.getCategories(),
      activities: storage.getActivities(),
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
      if (data.activities && Array.isArray(data.activities)) {
        localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(data.activities));
      }
      return true;
    } catch (e) {
      console.error('Failed to parse import data', e);
      return false;
    }
  }
};
