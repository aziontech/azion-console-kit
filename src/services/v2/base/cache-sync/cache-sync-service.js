import { queryClient } from '../query/queryClient'
import { activityHistoryService } from '@/services/v2/activity-history/activity-history-service'
import { getKeysForEvents } from './invalidation-map'
import { toMilliseconds } from '../query/config'
import { BroadcastManager, TabCoordinator } from '../broadcast'
import { logger } from '../logger'

const POLL_INTERVAL = toMilliseconds({ minutes: 2 })

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

  invalidateQueries(eventTitles) {
    const keysToInvalidate = getKeysForEvents(eventTitles)

    for (const queryKey of keysToInvalidate) {
      queryClient.removeQueries({ queryKey })
    }

    if (keysToInvalidate.length > 0) {
      logger.log('CacheSync', 'Queries invalidated:', keysToInvalidate.length)
    }
  }

  async poll() {
    if (!this.isPrimary) return

    try {
      const eventTitles = await activityHistoryService.listRecentEvents({
        intervalMinutes: 2
      })

      if (eventTitles.length > 0) {
        this.invalidateQueries(eventTitles)
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
