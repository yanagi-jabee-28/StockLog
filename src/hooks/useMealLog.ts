import { useState, useEffect, useCallback } from 'react';
import { MealLog } from '../types';
import { storage } from '../lib/storage';

export const useMealLog = () => {
  const [mealLogs, setMealLogsState] = useState<MealLog[]>([]);

  // Initial load
  useEffect(() => {
    const loadedMealLogs = storage.getMealLogs();
    setMealLogsState(loadedMealLogs);
  }, []);

  const addMealLog = useCallback((mealLog: Omit<MealLog, 'id'>) => {
    storage.addMealLog(mealLog);
    const updatedMealLogs = storage.getMealLogs();
    setMealLogsState(updatedMealLogs);
  }, []);

  const deleteMealLog = useCallback((id: string) => {
    storage.deleteMealLog(id);
    const updatedMealLogs = storage.getMealLogs();
    setMealLogsState(updatedMealLogs);
  }, []);

  const updateMealLog = useCallback((id: string, updates: Partial<Omit<MealLog, 'id'>>) => {
    storage.updateMealLog(id, updates);
    const updatedMealLogs = storage.getMealLogs();
    setMealLogsState(updatedMealLogs);
  }, []);

  return {
    mealLogs,
    addMealLog,
    deleteMealLog,
    updateMealLog,
  };
};
