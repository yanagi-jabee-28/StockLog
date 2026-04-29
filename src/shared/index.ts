/**
 * Shared Layer - Public API
 *
 * Cross-domain utilities, types, and components:
 * - Constants (categories, activity types)
 * - Common types
 * - Utility functions (ID generation, logging, alerts)
 * - Shared UI components
 */

// Constants
export { DEFAULT_CATEGORIES, CATEGORY_IDS, ACTIVITY_META } from './constants'

// Types
export type { Category } from './types/common'

// Utils
export { generateId } from './lib/id'
export { log, logError } from './lib/logger'
export { getItemAlertState } from './lib/alerts'
export { normalizePriceItem } from './lib/price'

// Hooks
export { useModalNavigation } from './hooks/useModalNavigation'
