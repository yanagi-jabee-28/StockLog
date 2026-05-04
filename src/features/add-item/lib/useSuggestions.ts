import { useMemo } from 'react';
import { InventoryItem, ActivityEntry } from '../../../shared/types';

/**
 * 履歴と既存アイテムのデータから、入力中の名前に基づくサジェスト一覧を算出するフック
 */
export function useSuggestions(
  name: string,
  items: InventoryItem[],
  activities: ActivityEntry[]
) {
  return useMemo(() => {
    if (!name.trim() || name.length < 1) return [];
    
    // 1. Calculate frequency and recency from activities
    const stats = new Map<string, { count: number; lastUsed: number }>();
    const now = Date.now();

    // Activities provide usage history
    activities.forEach(activity => {
      const lowerName = activity.itemName.toLowerCase();
      const timeWeight = Math.max(0, 1 - (now - new Date(activity.timestamp).getTime()) / (30 * 24 * 60 * 60 * 1000)); // Decay over 30 days
      const current = stats.get(lowerName) || { count: 0, lastUsed: 0 };
      stats.set(lowerName, {
        count: current.count + (1 + timeWeight), // More weight to frequent and recent items
        lastUsed: Math.max(current.lastUsed, new Date(activity.timestamp).getTime())
      });
    });

    // Items list provides unique templates
    const uniqueItemsMap = new Map<string, InventoryItem>();
    items.forEach(item => {
      const lowerName = item.name.toLowerCase();
      if (!uniqueItemsMap.has(lowerName) || (!uniqueItemsMap.get(lowerName)?.isArchived && item.isArchived)) {
         // Prefer active items as templates, but keep archived ones if they are unique
         uniqueItemsMap.set(lowerName, item);
      }
    });

    return Array.from(uniqueItemsMap.values())
      .filter(item => 
        item.name.toLowerCase().includes(name.toLowerCase()) && 
        item.name.toLowerCase() !== name.toLowerCase()
      )
      .sort((a, b) => {
        const statsA = stats.get(a.name.toLowerCase()) || { count: 0, lastUsed: 0 };
        const statsB = stats.get(b.name.toLowerCase()) || { count: 0, lastUsed: 0 };
        
        // Primary sort by frequency (weighted), secondary by name
        if (statsB.count !== statsA.count) return statsB.count - statsA.count;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 8); // Increased to 8 for better reach
  }, [items, activities, name]);
}
