import { queryClient } from '../query/queryClient'
import {
  activityHistoryService,
  SYNC_INTERVAL_MINUTES
} from '@/services/v2/activity-history/activity-history-service'
import { getKeysForEvents } from './invalidation-map'
import { toMilliseconds } from '../query/config'
import { BroadcastManager, TabCoordinator } from '../broadcast'
import { logger } from '../logger'

const POLL_INTERVAL = toMilliseconds({ minutes: SYNC_INTERVAL_MINUTES })

class CacheSyncService {
  constructor() {
    this.broadcast = null
    this.tabCoordinator = null
    this.pollIntervalId = null
    this.isInitialized = false
  }

  get isPrimary() {
    return this.tabCoordinator?.isPrimary ?? false
  }

  async invalidateQueries(eventTitles) {
    const keysToInvalidate = getKeysForEvents(eventTitles)

    for (const pattern of keysToInvalidate) {
      // Get ALL queries from cache
      const allQueries = queryClient.getQueryCache().getAll()

      // Manually filter queries that match the pattern
      // Pattern: ['origins', 'list'] should match ['origins', '123', 'list', 1, 200]
      const matchingQueries = allQueries.filter((query) => {
        return this.#queryKeyMatchesPattern(query.queryKey, pattern)
      })

      // Remove each matching query from cache
      for (const query of matchingQueries) {
        const isPersisted = query.meta?.persist !== false

        if (!isPersisted) {
          continue
        }

        // Skip if query doesn't have data (was never fetched)
        if (!query.state.data) {
          continue
        }

        try {
          await queryClient.removeQueries({ queryKey: query.queryKey, exact: true })
          await queryClient.invalidateQueries({ queryKey: query.queryKey, exact: true })
          await queryClient.refetchQueries({ queryKey: query.queryKey, exact: true })
        } catch (error) {
          logger.error('CacheSync', 'Failed to remove query:', query.queryKey, error)
        }
      }
    }
  }

  #queryKeyMatchesPattern(queryKey, pattern) {
    if (!Array.isArray(queryKey) || !Array.isArray(pattern)) {
      return false
    }

    if (pattern.length === 0) {
      return false
    }

    if (queryKey.length < pattern.length) {
      return false
    }

    let patternIndex = 0

    for (
      let queryIndex = 0;
      queryIndex < queryKey.length && patternIndex < pattern.length;
      queryIndex++
    ) {
      if (queryKey[queryIndex] === pattern[patternIndex]) {
        patternIndex++
      }
    }

    return patternIndex === pattern.length
  }

  async poll() {
    if (!this.isPrimary) return

    try {
      const eventTitles = await activityHistoryService.listRecentEvents({
        intervalMinutes: SYNC_INTERVAL_MINUTES
      })

      if (eventTitles.length > 0) {
        await this.invalidateQueries(eventTitles)
      }
    } catch (error) {
      logger.error('CacheSync', 'Poll failed:', error)
    }
  }

  startPolling() {
    this.stopPolling()
    this.poll()
    this.pollIntervalId = setInterval(() => this.poll(), POLL_INTERVAL)
  }

  stopPolling() {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId)
      this.pollIntervalId = null
    }
  }

  start() {
    if (this.isInitialized) return

    this.isInitialized = true

    this.broadcast = new BroadcastManager('cache-sync')
    this.broadcast.start()

    this.tabCoordinator = new TabCoordinator(this.broadcast, {
      onBecomePrimary: () => this.startPolling(),
      onLosePrimary: () => this.stopPolling()
    })

    this.tabCoordinator.start()
  }

  stop() {
    if (!this.isInitialized) return

    this.isInitialized = false
    this.stopPolling()
    this.tabCoordinator?.stop()
    this.broadcast?.close()
    this.broadcast = null
    this.tabCoordinator = null
  }

  reset() {
    this.stop()
  }
}

const cacheSyncService = new CacheSyncService()

export function startCacheSync() {
  cacheSyncService.start()
}

export function resetCacheSync() {
  cacheSyncService.reset()
}
