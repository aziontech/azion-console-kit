import { logger } from '../logger'

const HEARTBEAT_INTERVAL = 10000
const INACTIVE_TIMEOUT = HEARTBEAT_INTERVAL * 2

export class TabCoordinator {
  constructor(broadcast, callbacks = {}) {
    this.broadcast = broadcast
    this.tabId = broadcast.tabId

    this.isPrimary = false
    this.lastPrimaryHeartbeat = 0

    this.heartbeatIntervalId = null
    this.checkIntervalId = null

    this.onBecomePrimary = callbacks.onBecomePrimary || (() => {})
    this.onLosePrimary = callbacks.onLosePrimary || (() => {})
  }

  start() {
    this.broadcast.on('PRIMARY_HEARTBEAT', ({ tabId }) => {
      if (tabId !== this.tabId) {
        this.lastPrimaryHeartbeat = Date.now()
        if (this.isPrimary) {
          this.losePrimary()
        }
      }
    })

    this.broadcast.on('WHO_IS_PRIMARY', () => {
      if (this.isPrimary) {
        this.sendHeartbeat()
      }
    })

    this.broadcast.send('WHO_IS_PRIMARY')

    setTimeout(() => {
      if (!this.isPrimary && this.isPrimaryInactive()) {
        this.becomePrimary()
      } else {
        this.startCheck()
      }
    }, 1000)
  }

  isPrimaryInactive() {
    return (
      this.lastPrimaryHeartbeat === 0 || Date.now() - this.lastPrimaryHeartbeat > INACTIVE_TIMEOUT
    )
  }

  becomePrimary() {
    if (this.isPrimary) return

    this.isPrimary = true
    this.stopCheck()
    this.startHeartbeat()

    logger.log('TabCoordinator', 'This tab is now primary')
    this.onBecomePrimary()
  }

  losePrimary() {
    if (!this.isPrimary) return

    this.isPrimary = false
    this.stopHeartbeat()
    this.startCheck()

    logger.log('TabCoordinator', 'This tab lost primary status')
    this.onLosePrimary()
  }

  sendHeartbeat() {
    this.broadcast.send('PRIMARY_HEARTBEAT', { tabId: this.tabId })
  }

  startHeartbeat() {
    this.sendHeartbeat()
    this.heartbeatIntervalId = setInterval(() => this.sendHeartbeat(), HEARTBEAT_INTERVAL)
  }

  stopHeartbeat() {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId)
      this.heartbeatIntervalId = null
    }
  }

  startCheck() {
    this.checkIntervalId = setInterval(() => {
      if (this.isPrimaryInactive()) {
        this.becomePrimary()
      }
    }, HEARTBEAT_INTERVAL)
  }

  stopCheck() {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId)
      this.checkIntervalId = null
    }
  }

  stop() {
    this.stopHeartbeat()
    this.stopCheck()
    this.isPrimary = false
    this.lastPrimaryHeartbeat = 0
  }
}
