import { useMemo } from 'react';
import { InventoryItem } from '../types';
import { compareByExpiryThenName } from '../lib/alerts';

export function useInventoryView(
  items: InventoryItem[],
  activeCategoryId: string
) {
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (activeCategoryId === 'history') return true; // Show ALL in history
      return !item.isArchived && item.categoryId === activeCategoryId;
    }).sort((a, b) => {
      if (activeCategoryId === 'history') {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      }
      
      return compareByExpiryThenName(a, b);
    });
  }, [items, activeCategoryId]);

  const activeItems = useMemo(() => {
    return filteredItems
      .filter(item => item.isOpened)
      .sort((a, b) => {
        const percentDiff = (a.remainingPercent ?? 100) - (b.remainingPercent ?? 100);
        if (percentDiff !== 0) return percentDiff;
        return compareByExpiryThenName(a, b);
      });
  }, [filteredItems]);

  const unopenedItems = useMemo(() => {
    return filteredItems
      .filter(item => !item.isOpened)
      .sort(compareByExpiryThenName);
  }, [filteredItems]);

  const unopenedGroups = useMemo(() => {
    const groups = new Map<string, { name: string; items: InventoryItem[]; totalStock: number }>();

    for (const item of unopenedItems) {
      const key = item.name.trim().toLowerCase();
      const group = groups.get(key);
      if (!group) {
        groups.set(key, { name: item.name, items: [item], totalStock: item.stock });
        continue;
      }

      group.items.push(item);
      group.totalStock += item.stock;
    }

    return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name, 'ja'));
  }, [unopenedItems]);

  const totalStockByRootId = useMemo(() => {
    const totals = new Map<string, number>();

    for (const item of items) {
      if (item.isArchived) continue;

      const rootId = item.isOpened && item.originalItemId ? item.originalItemId : item.id;
      const current = totals.get(rootId) ?? 0;
      const contribution = item.isOpened ? 1 : item.stock;
      totals.set(rootId, current + contribution);
    }

    return totals;
  }, [items]);

  return { filteredItems, activeItems, unopenedItems, unopenedGroups, totalStockByRootId };
}
