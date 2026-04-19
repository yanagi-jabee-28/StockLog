export interface Category {
  id: string;
  name: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  categoryId: string;
  stock: number;
  unit: string;
  alertThreshold: number;
  remainingAmount?: string; // e.g., "70%", "Half", "Almost gone"
  isOpened?: boolean;
  originalItemId?: string; // Links an opened item back to its original stock item
}
