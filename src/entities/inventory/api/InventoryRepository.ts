import { InventoryItem, Category, ActivityEntry } from '../../../shared/types';

export interface InventoryRepository {
  getItems(): InventoryItem[];
  saveItems(items: InventoryItem[]): void;
  getCategories(): Category[];
  getActivities(): ActivityEntry[];
  addActivity(activity: Omit<ActivityEntry, 'id' | 'timestamp'>): void;
  deleteActivity(id: string): void;
  updateActivity(id: string, updates: Partial<ActivityEntry>): void;
  clearActivities(): void;
  repairData(): void;
  getUpdatedAt(): string | null;
}
