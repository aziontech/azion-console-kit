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
    const operations = keysToInvalidate.map(async (queryKey) => {

      await queryClient.invalidateQueries({ queryKey, exact: false, refetchType: 'none' })
      
      await queryClient.refetchQueries({
        queryKey,
        exact: false,
        type: 'all',
        predicate: (query) => typeof query?.options?.queryFn === 'function'
      })
    })

    await Promise.all(operations)
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
