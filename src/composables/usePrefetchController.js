/**
 * Composable for using Prefetch Controller
 *
 * Facilitates the use of prefetch controller in Vue components
 */

import {
  prefetch,
  prefetchMany,
  prefetchByTrigger,
  PREFETCH_TRIGGERS
} from '@/services/v2/base/query'
import { onMounted } from 'vue'

/**
 * Composable for managing prefetch
 * @param {Object} options - Composable options
 * @param {string} options.trigger - Trigger to execute (PREFETCH_TRIGGERS)
 * @param {Object} options.params - Parameters for queryFns
 * @param {Array<string>} options.names - Specific prefetch names to execute (optional)
 */
export function usePrefetchController(options = {}) {
  const { trigger, params = {}, names = null } = options

  /**
   * Executes prefetch based on trigger or specific names
   */
  const executePrefetch = async () => {
    if (names && Array.isArray(names)) {
      await prefetchMany(names, params)
    } else if (trigger) {
      await prefetchByTrigger(trigger, params)
    }
  }

  // Executes automatically on mount if trigger or names were provided
  if (trigger || names) {
    onMounted(() => {
      executePrefetch()
    })
  }

  return {
    executePrefetch,
    prefetch,
    prefetchMany,
    prefetchByTrigger,
    PREFETCH_TRIGGERS
  }
}

/**
 * Hook to prefetch Edge Application data when accessing the screen
 * @param {string} edgeApplicationId - Edge Application ID
 * @param {Object} options - Additional options
 */
export function usePrefetchEdgeAppOnAccess(edgeApplicationId, options = {}) {
  const { edgeFunctionsEnabled = false } = options

  const prefetchAll = async () => {
    if (!edgeApplicationId) return

    const params = {
      edgeApplicationId,
      edgeFunctionsEnabled
    }

    // Executes all 'viewEdgeApp' prefetches for Edge Applications
    await prefetchByTrigger(PREFETCH_TRIGGERS.VIEW_EDGE_APP, params)
  }

  onMounted(() => {
    prefetchAll()
  })

  return {
    prefetchAll,
    PREFETCH_TRIGGERS
  }
}
