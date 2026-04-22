import { Category, InventoryItem, ActivityEntry } from '../types';
import { CATEGORY_IDS, DEFAULT_CATEGORIES } from '../constants';
import { normalizePriceItem } from './price';

const STORAGE_KEY_ITEMS = 'stocklog_items';
const STORAGE_KEY_CATEGORIES = 'stocklog_categories';
const STORAGE_KEY_ACTIVITIES = 'stocklog_activities';
const APP_STORAGE_KEYS = [STORAGE_KEY_ITEMS, STORAGE_KEY_CATEGORIES, STORAGE_KEY_ACTIVITIES] as const;

const safeParse = <T>(key: string, fallback: T): T => {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`Corrupted localStorage data found for key: ${key}. Resetting to fallback.`, error);
    localStorage.removeItem(key);
    return fallback;
  }
};

const LEGACY_CATEGORY_MIGRATION: Record<string, string> = {
  stationery: CATEGORY_IDS.daily,
  priority: CATEGORY_IDS.fresh,
  priority_daily: CATEGORY_IDS.daily,
  beverages: CATEGORY_IDS.beverage,
  grocery: CATEGORY_IDS.fresh,
  prepped: CATEGORY_IDS.fresh,
  home_utility: CATEGORY_IDS.utility,
  emergency_stock: CATEGORY_IDS.emergency,
  med_cosme: CATEGORY_IDS.healthcare,
  clothing: CATEGORY_IDS.wardrobe,
};

const migrateCategoryId = (categoryId: string): string => {
  return LEGACY_CATEGORY_MIGRATION[categoryId] || categoryId;
};

const normalizeCategories = (categories: Category[]): Category[] => {
  const seen = new Set<string>();
  const normalized = categories
    .map(category => ({ ...category, id: migrateCategoryId(category.id) }))
    .filter(category => {
      if (seen.has(category.id)) return false;
      seen.add(category.id);
      return true;
    });

  for (const defaultCategory of DEFAULT_CATEGORIES) {
    if (!seen.has(defaultCategory.id)) {
      normalized.push(defaultCategory);
      seen.add(defaultCategory.id);
    }
  }

  return normalized;
};

const normalizeItems = (items: InventoryItem[]): InventoryItem[] => {
  const itemsById = new Map(items.map(item => [item.id, item]));

  const normalized = items.map(item => {
    let migratedCategoryId = migrateCategoryId(item.categoryId);

    // Old opened categories mixed "state" and "type". Recover likely type from the original item when possible.
    if ((item.categoryId === 'priority' || item.categoryId === 'priority_daily') && item.originalItemId) {
      const originalItem = itemsById.get(item.originalItemId);
      if (originalItem) {
        migratedCategoryId = migrateCategoryId(originalItem.categoryId);
      }
    }

    const migratedItem = {
      ...item,
      categoryId: migratedCategoryId,
    };

    return normalizePriceItem(migratedItem);
  });

  const idSet = new Set(normalized.map(item => item.id));

  return normalized.filter(item => {
    if (!item.isOpened) return true;
    if (!item.originalItemId) return false;
    return idSet.has(item.originalItemId);
  });
};

const appendIntegrityCleanupActivities = (removedItems: InventoryItem[]): void => {
  if (removedItems.length === 0) return;

  const data = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
  const activities: ActivityEntry[] = data ? JSON.parse(data) : [];
  const now = new Date().toISOString();

  const repairActivities: ActivityEntry[] = removedItems.map(item => ({
    id: crypto.randomUUID(),
    itemId: item.id,
    itemName: item.name,
    type: 'deleted',
    timestamp: now,
    details: '整合性修復: 親ロット不在の開封個体を自動削除'
  }));

  localStorage.setItem(
    STORAGE_KEY_ACTIVITIES,
    JSON.stringify([...repairActivities, ...activities].slice(0, 1000))
  );
};

export const storage = {
  getItems: (): InventoryItem[] => {
    const parsedItems = safeParse<InventoryItem[]>(STORAGE_KEY_ITEMS, []);
    const normalizedItems = normalizeItems(parsedItems);
    const normalizedIds = new Set(normalizedItems.map(item => item.id));
    const removedItems = parsedItems.filter(item => !normalizedIds.has(item.id) && item.isOpened);

    if (JSON.stringify(parsedItems) !== JSON.stringify(normalizedItems)) {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(normalizedItems));
      appendIntegrityCleanupActivities(removedItems);
    }

    return normalizedItems;
  },

  setItems: (items: InventoryItem[]): void => {
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
  },

  getCategories: (): Category[] => {
    const parsedCategories = safeParse<Category[]>(STORAGE_KEY_CATEGORIES, DEFAULT_CATEGORIES);
    const normalizedCategories = normalizeCategories(parsedCategories);

    if (JSON.stringify(parsedCategories) !== JSON.stringify(normalizedCategories)) {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(normalizedCategories));
    }

    return normalizedCategories;
  },

  setCategories: (categories: Category[]): void => {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
  },

  getActivities: (): ActivityEntry[] => {
    return safeParse<ActivityEntry[]>(STORAGE_KEY_ACTIVITIES, []);
  },

  clearAppData: (): void => {
    for (const key of APP_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  },

  repairData: (): void => {
    // Rewrites sanitized snapshots back into storage so malformed data is healed.
    const items = storage.getItems();
    const categories = storage.getCategories();
    const activities = storage.getActivities();
    storage.setItems(items);
    storage.setCategories(categories);
    localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(activities.slice(0, 1000)));
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
      version: '1.1.0',
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
      const sanitizedItems = items.map(item => normalizePriceItem({
        ...item,
        stock: Math.max(0, item.stock || 0),
        isOpened: !!item.isOpened,
        isArchived: !!item.isArchived,
        categoryId: migrateCategoryId(item.categoryId),
      }));

      const normalizedItems = normalizeItems(sanitizedItems);
      const normalizedIds = new Set(normalizedItems.map(item => item.id));
      const removedItems = sanitizedItems.filter(item => !normalizedIds.has(item.id) && item.isOpened);

      storage.setItems(normalizedItems);
      appendIntegrityCleanupActivities(removedItems);

      if (categories && Array.isArray(categories)) {
        storage.setCategories(normalizeCategories(categories));
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
