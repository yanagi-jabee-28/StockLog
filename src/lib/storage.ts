import { Category, InventoryItem, ActivityEntry, MealLog } from '../types';
import { CATEGORY_IDS, DEFAULT_CATEGORIES } from '../constants';
import { normalizePriceItem } from './price';
import { generateId } from './id';
import { logError, logWarn } from './logger';

const STORAGE_KEY_ITEMS = 'stocklog_items';
const STORAGE_KEY_CATEGORIES = 'stocklog_categories';
const STORAGE_KEY_ACTIVITIES = 'stocklog_activities';
const STORAGE_KEY_MEAL_LOGS = 'stocklog_meal_logs';
const STORAGE_KEY_META = 'stocklog_meta';
const APP_STORAGE_KEYS = [STORAGE_KEY_ITEMS, STORAGE_KEY_CATEGORIES, STORAGE_KEY_ACTIVITIES] as const;
const DEFAULT_CATEGORY_ID_SET = new Set(DEFAULT_CATEGORIES.map(category => category.id));

const safeParse = <T>(key: string, fallback: T): T => {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    logWarn(`Corrupted localStorage data found for key: ${key}. Resetting to fallback.`, error);
    localStorage.removeItem(key);
    return fallback;
  }
};

const safeParseValue = <T>(raw: string, fallback: T): T => {
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    logWarn('Corrupted JSON payload encountered. Using fallback value instead.', error);
    return fallback;
  }
};

const touchUpdatedAt = (): void => {
  localStorage.setItem(STORAGE_KEY_META, JSON.stringify({ updatedAt: new Date().toISOString() }));
};

const getUpdatedAtValue = (): string | null => {
  const raw = localStorage.getItem(STORAGE_KEY_META);
  if (!raw) {
    const items = safeParse<InventoryItem[]>(STORAGE_KEY_ITEMS, []);
    const activities = safeParse<ActivityEntry[]>(STORAGE_KEY_ACTIVITIES, []);

    const timestamps = [
      ...items.flatMap(item => [item.createdAt, item.archivedAt].filter((value): value is string => typeof value === 'string')),
      ...activities.map(activity => activity.timestamp),
    ]
      .map(value => new Date(value).getTime())
      .filter(time => !Number.isNaN(time));

    if (timestamps.length === 0) return null;

    const fallbackUpdatedAt = new Date(Math.max(...timestamps)).toISOString();
    touchUpdatedAt();
    localStorage.setItem(STORAGE_KEY_META, JSON.stringify({ updatedAt: fallbackUpdatedAt }));
    return fallbackUpdatedAt;
  }

  try {
    const parsed = JSON.parse(raw) as { updatedAt?: unknown };
    return typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null;
  } catch {
    return null;
  }
};

const LEGACY_CATEGORY_MIGRATION: Record<string, string> = {
  stationery: CATEGORY_IDS.daily,
  priority: CATEGORY_IDS.fresh,
  priority_daily: CATEGORY_IDS.daily,
  beverages: CATEGORY_IDS.beverage,
  cosmetics: CATEGORY_IDS.beauty,
  grocery: CATEGORY_IDS.fresh,
  prepped: CATEGORY_IDS.fresh,
  home_utility: CATEGORY_IDS.utility,
  emergency_stock: CATEGORY_IDS.emergency,
  med_cosme: CATEGORY_IDS.healthcare,
  clothing: CATEGORY_IDS.wardrobe,
  innerwear: CATEGORY_IDS.wardrobe,
  accessories: CATEGORY_IDS.wardrobe,
  seasonal: CATEGORY_IDS.wardrobe,
};

const migrateCategoryId = (categoryId: string): string => {
  return LEGACY_CATEGORY_MIGRATION[categoryId] || categoryId;
};

const normalizeCategories = (_categories: Category[]): Category[] => {
  // Category labels and order are source-of-truth in DEFAULT_CATEGORIES.
  // Stored category names/order are intentionally ignored to prevent stale UI labels.
  return [...DEFAULT_CATEGORIES];
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
  const activities: ActivityEntry[] = data ? safeParseValue<ActivityEntry[]>(data, []) : [];
  const now = new Date().toISOString();

  const repairActivities: ActivityEntry[] = removedItems.map(item => ({
    id: generateId(),
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
    touchUpdatedAt();
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
    touchUpdatedAt();
  },

  getActivities: (): ActivityEntry[] => {
    return safeParse<ActivityEntry[]>(STORAGE_KEY_ACTIVITIES, []);
  },

  clearAppData: (): void => {
    for (const key of APP_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
    localStorage.removeItem(STORAGE_KEY_META);
  },

  resetToDefaults: (): void => {
    storage.clearAppData();
    storage.setItems([]);
    storage.setCategories(DEFAULT_CATEGORIES);
    storage.clearActivities();
    touchUpdatedAt();
  },

  repairData: (): void => {
    // Rewrites sanitized snapshots back into storage so malformed data is healed.
    const items = storage.getItems();
    const categories = storage.getCategories();
    const activities = storage.getActivities();
    storage.setItems(items);
    storage.setCategories(categories);
    localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(activities.slice(0, 1000)));
    touchUpdatedAt();
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
          touchUpdatedAt();
          return;
        }
      }
    }

    const newActivity: ActivityEntry = {
      ...activity,
      id: generateId(),
      timestamp: now.toISOString()
    };
    const updatedActivities = [newActivity, ...activities].slice(0, 1000);
    localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(updatedActivities));
    touchUpdatedAt();
  },

  deleteActivity: (id: string): void => {
    const activities = storage.getActivities().filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(activities));
    touchUpdatedAt();
  },

  updateActivity: (id: string, updates: Partial<ActivityEntry>): void => {
    const activities = storage.getActivities().map(a => 
      a.id === id ? { ...a, ...updates } : a
    );
    localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(activities));
    touchUpdatedAt();
  },

  clearActivities: (): void => {
    localStorage.removeItem(STORAGE_KEY_ACTIVITIES);
    touchUpdatedAt();
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
      const parsed = safeParseValue<Record<string, unknown>>(jsonString, {});
      
      // Compatibility Layer: Handle both flat and nested formats
      const parsedData = (parsed.data as Record<string, unknown> | undefined) ?? undefined;
      const items = (parsedData?.items || parsed.items) as InventoryItem[];
      const categories = (parsedData?.categories || parsed.categories) as Category[];
      const activities = (parsedData?.activities || parsed.activities) as ActivityEntry[];

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

      touchUpdatedAt();

      return true;
    } catch (e) {
      logError('Failed to import data:', e);
      return false;
    }
  }

  ,

  getUpdatedAt: (): string | null => {
    return getUpdatedAtValue();
  },

  getMealLogs: (): MealLog[] => {
    return safeParse<MealLog[]>(STORAGE_KEY_MEAL_LOGS, []);
  },

  setMealLogs: (mealLogs: MealLog[]): void => {
    localStorage.setItem(STORAGE_KEY_MEAL_LOGS, JSON.stringify(mealLogs));
    touchUpdatedAt();
  },

  addMealLog: (mealLog: Omit<MealLog, 'id'>): void => {
    const mealLogs = storage.getMealLogs();
    const newMealLog: MealLog = {
      ...mealLog,
      id: generateId()
    };
    const updatedMealLogs = [newMealLog, ...mealLogs];
    storage.setMealLogs(updatedMealLogs);
  },

  deleteMealLog: (id: string): void => {
    const mealLogs = storage.getMealLogs().filter(log => log.id !== id);
    storage.setMealLogs(mealLogs);
  },

  updateMealLog: (id: string, updates: Partial<Omit<MealLog, 'id'>>): void => {
    const mealLogs = storage.getMealLogs().map(log =>
      log.id === id ? { ...log, ...updates } : log
    );
    storage.setMealLogs(mealLogs);
  }
};
