import { useState, useEffect, useCallback } from 'react';
import { MealLog } from '../../../shared/types';
import { mealRepository } from '../api/LocalStorageMealRepository';

export const useMealLog = () => {
  const [mealLogs, setMealLogsState] = useState<MealLog[]>([]);

  // Initial load
  useEffect(() => {
    const loadedMealLogs = mealRepository.getMealLogs();
    setMealLogsState(loadedMealLogs);
  }, []);

  const addMealLog = useCallback((mealLog: Omit<MealLog, 'id'>) => {
    mealRepository.addMealLog(mealLog);
    const updatedMealLogs = mealRepository.getMealLogs();
    setMealLogsState(updatedMealLogs);
  }, []);

  const deleteMealLog = useCallback((id: string) => {
    mealRepository.deleteMealLog(id);
    const updatedMealLogs = mealRepository.getMealLogs();
    setMealLogsState(updatedMealLogs);
  }, []);

  const updateMealLog = useCallback((id: string, updates: Partial<Omit<MealLog, 'id'>>) => {
    mealRepository.updateMealLog(id, updates);
    const updatedMealLogs = mealRepository.getMealLogs();
    setMealLogsState(updatedMealLogs);
  }, []);

  return {
    mealLogs,
    addMealLog,
    deleteMealLog,
    updateMealLog,
  };
};
