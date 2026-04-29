/**
 * Meals Feature Types
 */

export interface MealLog {
  id: string;
  date: number;
  name: string;
  ingredients: string[];
  notes: string;
}
