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
  { id: 'hobby', name: '🎨 趣味・ホビー' },
  { id: 'stationery', name: '🖋️ 文具・事務用品' },
  { id: 'med_cosme', name: '💄 常備薬・コスメ' },
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
    const items = storage.getItems();
    const categories = storage.getCategories();
    const activities = storage.getActivities();
    
    const data = {
      version: '1.0.0',
      appName: 'StockLog',
      exportDate: new Date().toISOString(),
      data: {
        items,
        categories,
        activities
      }
    };
    return JSON.stringify(data, null, 2);
  },

  importData: (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      
      // Compatibility Layer: Handle both flat and nested formats
      const items = (parsed.data?.items || parsed.items) as InventoryItem[];
      const categories = (parsed.data?.categories || parsed.categories) as Category[];
      const activities = (parsed.data?.activities || parsed.activities) as ActivityEntry[];

      if (!items || !Array.isArray(items)) {
        throw new Error('Invalid items data');
      }

      // Basic validation and sanitization
      const sanitizedItems = items.map(item => ({
        ...item,
        stock: Math.max(0, item.stock || 0),
        isOpened: !!item.isOpened,
        isArchived: !!item.isArchived,
      }));

      storage.setItems(sanitizedItems);

      if (categories && Array.isArray(categories)) {
        storage.setCategories(categories);
      }

      if (activities && Array.isArray(activities)) {
        localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(activities.slice(0, 1000)));
      }

      return true;
    } catch (e) {
      console.error('Failed to import data:', e);
      return false;
    }
  }
};
