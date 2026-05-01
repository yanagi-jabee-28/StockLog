import { MealLog } from '../../../shared/types';

export interface MealRepository {
  getMealLogs(): MealLog[];
  saveMealLogs(logs: MealLog[]): void;
  addMealLog(log: Omit<MealLog, 'id'>): void;
  deleteMealLog(id: string): void;
  updateMealLog(id: string, updates: Partial<Omit<MealLog, 'id'>>): void;
}
