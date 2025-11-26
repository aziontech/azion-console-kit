/**
 * Prefetch System - Entry Point (Legacy)
 *
 * @deprecated Use @/services/v2/base/query instead
 * Maintained for compatibility, but redirects to the new architecture
 */

import { registerPrefetchModule } from '@/services/v2/base/query'
import { registerEdgeAppPrefetchConfigs } from '@/services/v2/edge-app/edge-app-prefetch-config'

/**
 * Initializes the prefetch system
 * Registers all available configurations
 */
export function initializePrefetchSystem() {
  registerPrefetchModule('edge-app', registerEdgeAppPrefetchConfigs)
}

if (typeof window !== 'undefined') {
  initializePrefetchSystem()
}

export {
  prefetch,
  prefetchMany,
  prefetchByTrigger,
  registerPrefetchModule,
  PREFETCH_TRIGGERS
} from '@/services/v2/base/query'
export {
  usePrefetchController,
  usePrefetchEdgeAppOnAccess
} from '@/composables/usePrefetchController'
