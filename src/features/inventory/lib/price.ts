import { InventoryItem, PriceHistoryEntry } from '../types';

const toNonNegativeNumber = (value: unknown): number | undefined => {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) return undefined;
  return Math.max(0, value);
};

const getPricePerUnit = (purchasePrice?: number, contentAmount?: number): number | undefined => {
  if (typeof purchasePrice !== 'number' || purchasePrice <= 0) return undefined;
  if (typeof contentAmount !== 'number' || contentAmount <= 0) return purchasePrice;
  return Math.round((purchasePrice / contentAmount) * 100) / 100;
};

export const normalizePriceHistory = (history?: PriceHistoryEntry[]): PriceHistoryEntry[] => {
  if (!Array.isArray(history)) return [];

  const normalizedHistory: PriceHistoryEntry[] = [];

  for (const entry of history) {
    const purchasePrice = toNonNegativeNumber(entry.purchasePrice);
    const contentAmount = toNonNegativeNumber(entry.contentAmount);
    const pricePerUnit = toNonNegativeNumber(entry.pricePerUnit) ?? getPricePerUnit(purchasePrice, contentAmount);

    if (purchasePrice === undefined && pricePerUnit === undefined) continue;

    const normalizedEntry: PriceHistoryEntry = {
      timestamp: entry.timestamp,
      purchasePrice: purchasePrice ?? (pricePerUnit ?? 0),
      pricePerUnit: pricePerUnit ?? (purchasePrice ?? 0),
      notes: entry.notes?.trim() || undefined,
    };

    if (contentAmount !== undefined) {
      normalizedEntry.contentAmount = contentAmount;
    }

    if (entry.contentUnit?.trim()) {
      normalizedEntry.contentUnit = entry.contentUnit.trim();
    }

    normalizedHistory.push(normalizedEntry);
  }

  return normalizedHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const normalizePriceItem = (item: InventoryItem): InventoryItem => {
  const purchasePrice = toNonNegativeNumber(item.purchasePrice);
  const contentAmount = toNonNegativeNumber(item.contentAmount);
  const contentUnit = item.contentUnit?.trim() || undefined;
  const priceHistory = normalizePriceHistory(item.priceHistory);

  const latestHistory = priceHistory[0];
  const currentPurchasePrice = purchasePrice ?? latestHistory?.purchasePrice;
  const currentContentAmount = contentAmount ?? latestHistory?.contentAmount;
  const currentContentUnit = contentUnit ?? latestHistory?.contentUnit;
  const currentPricePerUnit = toNonNegativeNumber(item.pricePerUnit)
    ?? latestHistory?.pricePerUnit
    ?? getPricePerUnit(currentPurchasePrice, currentContentAmount);

  const lowestPricePerUnit = toNonNegativeNumber(item.lowestPricePerUnit)
    ?? (priceHistory.length > 0
      ? Math.min(...priceHistory.map(entry => entry.pricePerUnit))
      : currentPricePerUnit);

  const normalizedItem: InventoryItem = {
    ...item,
    purchasePrice: currentPurchasePrice,
    contentAmount: currentContentAmount,
    contentUnit: currentContentUnit,
    pricePerUnit: currentPricePerUnit,
    lowestPricePerUnit,
    priceHistory,
  };

  const normalizedHistory = normalizedItem.priceHistory ?? [];

  if (!normalizedHistory.length && currentPurchasePrice !== undefined) {
    normalizedItem.priceHistory = [{
      timestamp: item.createdAt,
      purchasePrice: currentPurchasePrice,
      contentAmount: currentContentAmount,
      contentUnit: currentContentUnit,
      pricePerUnit: currentPricePerUnit ?? currentPurchasePrice,
      notes: undefined,
    }];
  }

  if (normalizedItem.lowestPricePerUnit === undefined && normalizedItem.pricePerUnit !== undefined) {
    normalizedItem.lowestPricePerUnit = normalizedItem.pricePerUnit;
  }

  return normalizedItem;
};

export const buildPriceHistoryEntry = (
  item: Pick<InventoryItem, 'createdAt' | 'notes'> & {
    purchasePrice?: number;
    contentAmount?: number;
    contentUnit?: string;
    pricePerUnit?: number;
    priceNotes?: string;
  },
  timestamp = new Date().toISOString()
): PriceHistoryEntry | null => {
  const purchasePrice = toNonNegativeNumber(item.purchasePrice);
  const contentAmount = toNonNegativeNumber(item.contentAmount);
  const contentUnit = item.contentUnit?.trim() || undefined;
  const pricePerUnit = toNonNegativeNumber(item.pricePerUnit) ?? getPricePerUnit(purchasePrice, contentAmount);

  if (purchasePrice === undefined && pricePerUnit === undefined) return null;

  return {
    timestamp,
    purchasePrice: purchasePrice ?? (pricePerUnit ?? 0),
    contentAmount,
    contentUnit,
    pricePerUnit: pricePerUnit ?? (purchasePrice ?? 0),
    notes: item.priceNotes?.trim() || item.notes?.trim() || undefined,
  };
};

export const formatCurrency = (value?: number): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-';
  return new Intl.NumberFormat('ja-JP', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
};
