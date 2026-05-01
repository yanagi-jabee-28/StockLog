import { InventoryItem, Category, ActivityEntry } from '../../../shared/types';
import { InventoryRepository } from './InventoryRepository';
import { storage } from '../../../shared/lib/storage';

export class LocalStorageInventoryRepository implements InventoryRepository {
  getItems(): InventoryItem[] {
    return storage.getItems();
  }

  saveItems(items: InventoryItem[]): void {
    storage.setItems(items);
  }

  getCategories(): Category[] {
    return storage.getCategories();
  }

  getActivities(): ActivityEntry[] {
    return storage.getActivities();
  }

  addActivity(activity: Omit<ActivityEntry, 'id' | 'timestamp'>): void {
    storage.addActivity(activity);
  }

  deleteActivity(id: string): void {
    storage.deleteActivity(id);
  }

  updateActivity(id: string, updates: Partial<ActivityEntry>): void {
    storage.updateActivity(id, updates);
  }

  clearActivities(): void {
    storage.clearActivities();
  }

  repairData(): void {
    storage.repairData();
  }

  getUpdatedAt(): string | null {
    return storage.getUpdatedAt();
  }

  exportData(): string {
    return storage.exportData();
  }

  importData(json: string): boolean {
    return storage.importData(json);
  }

  resetToDefaults(): void {
    storage.resetToDefaults();
  }
}

export const inventoryRepository = new LocalStorageInventoryRepository();
