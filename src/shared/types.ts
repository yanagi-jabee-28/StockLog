export interface Category {
  id: string;
  name: string;
}

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
  alertThresholdPercent?: number; // threshold for opened items (0-100)
  remainingAmount?: string; // e.g., "70", "Full", etc.
  remainingPercent?: number; // numerical remaining percentage (0-100)
  isOpened?: boolean;
  isArchived?: boolean;
  archivedAt?: string;
  createdAt: string;
  originalItemId?: string; // Links an opened item back to its original stock item
  expiryDate?: string; // Optional expiry/best-before date
  notes?: string; // Optional notes or remarks
  purchasePrice?: number;
  contentAmount?: number;
  contentUnit?: string;
  pricePerUnit?: number;
  lowestPricePerUnit?: number;
  priceHistory?: PriceHistoryEntry[];
}

export type ActivityType = 
  | 'added' 
  | 'stock_up' 
  | 'stock_down' 
  | 'opened' 
  | 'remaining_update' 
  | 'archived' 
  | 'deleted' 
  | 'edited';

export interface MealLog {
  id: string;
  date: number;          // タイムスタンプ（記録日時）
  name: string;          // 料理名
  ingredients: string[]; // 使用食材の配列
  notes: string;         // 調理のプロトコルや実験の記録
}

export interface ActivityEntry {
  id: string;
  itemId: string;
  itemName: string;
  type: ActivityType;
  timestamp: string;
  details?: string;
}
