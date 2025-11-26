/**
 * Prefetch System - Simplified
 *
 * Simple prefetch system that leverages TanStack Query native features.
 * TanStack Query already manages cache, deduplication and promises automatically.
 */

import { queryClient } from './queryClient'
import { createQueryKey, getCacheOptions } from './queryClient'
import { CACHE_TYPE } from './config'
import { waitForPersistenceRestore } from './queryPlugin'

/**
 * Available triggers for prefetch execution
 *
 * Descriptive names that indicate when the prefetch should be executed.
 * Use specific and descriptive names following the pattern: view{Module} or {action}{Resource}
 *
 * Examples:
 * - LOGIN: Executes after user login
 * - VIEW_EDGE_APP: Executes when viewing/editing Edge Application
 * - VIEW_EDGE_FIREWALL: Executes when viewing/editing Edge Firewall
 * - MANUAL: Manual/explicit execution
 *
 * To add new triggers:
 * 1. Add the constant here
 * 2. Use in prefetch registrations (edge-app-prefetch-config.js, etc.)
 * 3. Execute via prefetchByTrigger(TRIGGER_NAME, params)
 */
export const PREFETCH_TRIGGERS = {
  LOGIN: 'login',
  VIEW_EDGE_APP: 'viewEdgeApp',
  VIEW_EDGE_FIREWALL: 'viewEdgeFirewall',
  MANUAL: 'manual'
}

/**
 * Prefetch configurations by name
 * @type {Map<string, PrefetchConfig>}
 */
const prefetchConfigs = new Map()

/**
 * Registers a prefetch configuration
 * @param {string} name - Unique name (format: 'module:resource')
 * @param {Object} config - Configuration
 * @param {Function} config.queryFn - Function that receives params and returns { queryKey, queryFn }
 * @param {Array<string>} config.triggers - Triggers that execute this prefetch
 * @param {string} config.cache - Cache type (CACHE_TYPE)
 * @param {Object} config.options - TanStack Query options
 */
export function registerPrefetch(name, config) {
  prefetchConfigs.set(name, {
    triggers: config.triggers || [PREFETCH_TRIGGERS.MANUAL],
    cache: config.cache || CACHE_TYPE.GLOBAL,
    options: config.options || {},
    queryFn: config.queryFn
  })
}

/**
 * Executes a specific prefetch
 * TanStack Query already manages deduplication and cache automatically
 * @param {string} name - Configuration name
 * @param {Object} params - Parameters
 * @returns {Promise}
 */
export async function prefetch(name, params = {}) {
  const config = prefetchConfigs.get(name)
  if (!config) {
    return Promise.resolve()
  }

  if (config.options?.enabled !== undefined) {
    const enabled =
      typeof config.options.enabled === 'function'
        ? config.options.enabled(params)
        : config.options.enabled
    if (!enabled) {
      return Promise.resolve()
    }
  }

  await waitForPersistenceRestore()

  const { queryKey: rawQueryKey, queryFn } = config.queryFn(params)
  const queryKey = createQueryKey(rawQueryKey, config.cache)
  const cacheOptions = getCacheOptions(config.cache)
  const finalOptions = { ...cacheOptions, ...config.options }

  return queryClient.prefetchQuery({
    queryKey,
    queryFn,
    ...finalOptions
  })
}

/**
 * Executes multiple prefetches in parallel
 * @param {Array<string>} names - Configuration names
 * @param {Object} params - Parameters
 * @returns {Promise}
 */
export async function prefetchMany(names, params = {}) {
  const promises = names.map((name) => prefetch(name, params))
  return Promise.allSettled(promises)
}

/**
 * Executes all prefetches for a specific trigger
 * @param {string} trigger - Trigger name
 * @param {Object} params - Parameters
 * @returns {Promise}
 */
export async function prefetchByTrigger(trigger, params = {}) {
  const names = []
  for (const [name, config] of prefetchConfigs.entries()) {
    if (config.triggers.includes(trigger)) {
      names.push(name)
    }
  }
  return prefetchMany(names, params)
}

/**
 * Registers a complete prefetch module
 * @param {string} moduleName - Module name
 * @param {Function} registerFn - Function that receives { registerPrefetch, PREFETCH_TRIGGERS }
 */
export function registerPrefetchModule(moduleName, registerFn) {
  registerFn({ registerPrefetch, PREFETCH_TRIGGERS })
}
