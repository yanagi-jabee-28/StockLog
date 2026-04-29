// ⚠️ PHASE 2 WORK IN PROGRESS
// Zod import temporarily commented out until packages are installed
// This file is not yet imported in any active code path
// Do not use until zod/zustand are installed and Phase 2 is complete

// import { z } from 'zod';

/**
 * Meals Feature - Zod Schemas (PHASE 2 - NOT YET ACTIVE)
 * 
 * ❌ WARNING: This file requires 'zod' package - DO NOT IMPORT IN PRODUCTION
 * ✅ Ready for Phase 2 when packages are installed
 */

/*
export const MealLogSchema = z.object({
  id: z.string(),
  date: z.number().int(), // timestamp
  name: z.string().min(1),
  ingredients: z.array(z.string()),
  notes: z.string(),
});

export const MealLogInputSchema = MealLogSchema.omit({ id: true });

export const MealsStateSchema = z.object({
  entities: z.record(z.string(), MealLogSchema),
  ids: z.array(z.string()),
  version: z.number().default(1),
  lastUpdated: z.string().datetime(),
});
*/

// Temporary type definitions (Use actual Zod inferred types in Phase 2)
export type MealLog = {
  id: string;
  date: number;
  name: string;
  ingredients: string[];
  notes: string;
};

export type MealLogInput = Omit<MealLog, 'id'>;

export type MealsState = {
  entities: Record<string, MealLog>;
  ids: string[];
  version: number;
  lastUpdated: string;
};
