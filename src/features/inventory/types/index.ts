/**
 * Inventory Feature Types
 */

export interface PriceHistoryEntry {
  timestamp: string;
  purchasePrice: number;
  contentAmount?: number;
  contentUnit?: string;
  pricePerUnit: number;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  categoryId: string;
  isHistoryView?: boolean;
  stock: number;
  unit: string;
  alertThreshold: number;
  alertThresholdPercent?: number;
  remainingAmount?: string;
  remainingPercent?: number;
  isOpened?: boolean;
  isArchived?: boolean;
  archivedAt?: string;
  createdAt: string;
  originalItemId?: string;
  expiryDate?: string;
  notes?: string;
  purchasePrice?: number;
  contentAmount?: number;
  contentUnit?: string;
  pricePerUnit?: number;
  lowestPricePerUnit?: number;
  priceHistory?: PriceHistoryEntry[];
}
