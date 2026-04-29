/**
 * Inventory Feature - Public API
 *
 * This feature handles all inventory management logic:
 * - Item CRUD operations
 * - Stock tracking and updates
 * - Opened item management
 * - Activity logging
 */

// Components
export { InventoryItemCard } from './ui/InventoryItemCard'
export { AddItemModal } from './ui/AddItemModal'
export { SettingsModal } from './ui/SettingsModal'

// Types (will be moved here during Phase 2)
// export type { InventoryItem, InventoryState } from './types'

// Store (Phase 2+)
// export { useInventoryStore } from './store'

// Utils
export { updateItemWithGroupSync } from './lib/itemSync'
export { normalizePriceItem } from './lib/price'
