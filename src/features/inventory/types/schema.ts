// ⚠️ PHASE 2 WORK IN PROGRESS
// Zod import temporarily commented out until packages are installed
// This file is not yet imported in any active code path
// Do not use until zod/zustand are installed and Phase 2 is complete

// import { z } from 'zod';

/**
 * Inventory Feature - Zod Schemas (PHASE 2 - NOT YET ACTIVE)
 * Runtime validation for type safety and data integrity
 * 
 * ❌ WARNING: This file requires 'zod' package - DO NOT IMPORT IN PRODUCTION
 * ✅ Ready for Phase 2 when packages are installed
 */

/*
// === Common Schemas ===
export const PriceHistoryEntrySchema = z.object({
  timestamp: z.string().datetime(),
  purchasePrice: z.number().min(0),
  contentAmount: z.number().min(0).optional(),
  contentUnit: z.string().optional(),
  pricePerUnit: z.number().min(0),
  notes: z.string().optional(),
});

// === Inventory Item Schemas ===
export const InventoryItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  categoryId: z.string(),
  stock: z.number().int().min(0),
  unit: z.string(),
  alertThreshold: z.number().int().min(0),
  alertThresholdPercent: z.number().int().min(0).max(100).optional(),
  remainingAmount: z.string().optional(),
  remainingPercent: z.number().int().min(0).max(100).optional(),
  isOpened: z.boolean().optional().default(false),
  isArchived: z.boolean().optional().default(false),
  archivedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  originalItemId: z.string().optional(),
  expiryDate: z.string().date().optional(),
  notes: z.string().optional(),
  purchasePrice: z.number().min(0).optional(),
  contentAmount: z.number().min(0).optional(),
  contentUnit: z.string().optional(),
  pricePerUnit: z.number().min(0).optional(),
  lowestPricePerUnit: z.number().min(0).optional(),
  priceHistory: z.array(PriceHistoryEntrySchema).optional(),
  isHistoryView: z.boolean().optional(),
});

export const InventoryItemInputSchema = InventoryItemSchema.omit({
  id: true,
  createdAt: true,
});

// === Normalized State Schemas ===
export const InventoryStateSchema = z.object({
  entities: z.record(z.string(), InventoryItemSchema),
  ids: z.array(z.string()),
  unopenedItemsByName: z.record(z.string(), z.array(z.string())), // Computed index
  version: z.number().default(1),
  lastUpdated: z.string().datetime(),
});
*/

// Temporary type definitions (Use actual Zod inferred types in Phase 2)
export type PriceHistoryEntry = {
  timestamp: string;
  purchasePrice: number;
  contentAmount?: number;
  contentUnit?: string;
  pricePerUnit: number;
  notes?: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  categoryId: string;
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
  isHistoryView?: boolean;
};

export type InventoryItemInput = Omit<InventoryItem, 'id' | 'createdAt'>;

export type InventoryState = {
  entities: Record<string, InventoryItem>;
  ids: string[];
  unopenedItemsByName: Record<string, string[]>;
  version: number;
  lastUpdated: string;
};
