/**
 * Shared types - Common across all features
 */

export interface Category {
  id: string;
  name: string;
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

export interface ActivityEntry {
  id: string;
  itemId: string;
  itemName: string;
  type: ActivityType;
  timestamp: string;
  details?: string;
}
