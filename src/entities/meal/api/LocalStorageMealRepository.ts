import { MealLog } from '../../../shared/types';
import { MealRepository } from './MealRepository';
import { storage } from '../../../shared/lib/storage';

export class LocalStorageMealRepository implements MealRepository {
  getMealLogs(): MealLog[] {
    return storage.getMealLogs();
  }

  saveMealLogs(logs: MealLog[]): void {
    storage.setMealLogs(logs);
  }

  addMealLog(log: Omit<MealLog, 'id'>): void {
    storage.addMealLog(log);
  }

  deleteMealLog(id: string): void {
    storage.deleteMealLog(id);
  }

  updateMealLog(id: string, updates: Partial<Omit<MealLog, 'id'>>): void {
    storage.updateMealLog(id, updates);
  }
}

export const mealRepository = new LocalStorageMealRepository();
