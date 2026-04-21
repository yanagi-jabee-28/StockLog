import { InventoryItem } from '../types';

const getRootId = (target: InventoryItem): string => {
  return target.isOpened && target.originalItemId ? target.originalItemId : target.id;
};

const isInSyncGroup = (item: InventoryItem, rootId: string): boolean => {
  return item.id === rootId || item.originalItemId === rootId;
};

const toSyncableUpdates = (updates: Partial<InventoryItem>): Partial<InventoryItem> => {
  const syncableUpdates = { ...updates };
  delete syncableUpdates.isOpened;
  delete syncableUpdates.remainingPercent;
  delete syncableUpdates.remainingAmount;
  delete syncableUpdates.id;
  return syncableUpdates;
};

export const updateItemWithGroupSync = (
  items: InventoryItem[],
  targetId: string,
  updates: Partial<InventoryItem>
): InventoryItem[] => {
  const target = items.find(item => item.id === targetId);
  if (!target) return items;

  const rootId = getRootId(target);
  const syncableUpdates = toSyncableUpdates(updates);

  return items.map(item => {
    if (item.id === targetId) {
      return { ...item, ...updates };
    }

    if (isInSyncGroup(item, rootId)) {
      return { ...item, ...syncableUpdates };
    }

    return item;
  });
};

export const setStockForGroupByTarget = (
  items: InventoryItem[],
  targetId: string,
  nextStock: number
): InventoryItem[] => {
  const target = items.find(item => item.id === targetId);
  if (!target) return items;

  const rootId = getRootId(target);

  return items.map(item => {
    if (isInSyncGroup(item, rootId)) {
      return { ...item, stock: nextStock };
    }
    return item;
  });
};

export const setStockForGroupByRoot = (
  items: InventoryItem[],
  rootId: string,
  nextStock: number
): InventoryItem[] => {
  return items.map(item => {
    if (isInSyncGroup(item, rootId)) {
      return { ...item, stock: nextStock };
    }
    return item;
  });
};
