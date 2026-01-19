import { isProduction } from '@/helpers/get-environment'

function getChannelName(name) {
  return isProduction() ? `azion-${name}-prod` : `azion-${name}-dev`
}

export function generateTabId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

export class BroadcastManager {
  constructor(channelName, options = {}) {
    this.channelName = getChannelName(channelName)
    this.tabId = options.tabId || generateTabId()
    this.channel = null
    this.listeners = new Map()
  }

  start() {
    if (this.channel || typeof BroadcastChannel === 'undefined') return

    this.channel = new BroadcastChannel(this.channelName)
    this.channel.addEventListener('message', (event) => {
      const { type, fromTabId, ...data } = event.data

      if (fromTabId === this.tabId) return

      const listener = this.listeners.get(type)
      if (listener) {
        listener(data, fromTabId)
      }
    })
  }

  on(type, callback) {
    this.listeners.set(type, callback)
  }

  send(type, payload = {}) {
    this.channel?.postMessage({
      type,
      ...payload,
      fromTabId: this.tabId,
      timestamp: Date.now()
    })
  }

  close() {
    this.channel?.close()
    this.channel = null
    this.listeners.clear()
  }
}
