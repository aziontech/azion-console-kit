import { ref, computed, onMounted, onUnmounted } from 'vue'
import { cacheSyncService } from '@/services/v2/base/cache-sync/cache-sync-service'

/**
 * Composable for accessing SSE connection state in Vue components
 *
 * @returns {{
 *   isConnected: import('vue').Ref<boolean>,
 *   clientId: import('vue').Ref<string|null>,
 *   connectionState: import('vue').ComputedRef<'connected'|'connecting'|'disconnected'|'error'>,
 *   lastEvent: import('vue').Ref<Object|null>,
 *   error: import('vue').Ref<Error|null>,
 *   subscribe: (event: string, callback: Function) => Function
 * }}
 */
export function useSSE() {
  const isConnected = ref(false)
  const clientId = ref(null)
  const lastEvent = ref(null)
  const error = ref(null)

  const unsubscribers = []

  const connectionState = computed(() => {
    if (isConnected.value) return 'connected'
    if (error.value) return 'error'
    return 'disconnected'
  })

  onMounted(() => {
    // Sync initial state from service
    const state = cacheSyncService.state
    isConnected.value = state.isConnected
    clientId.value = state.clientId

    // Subscribe to connection events
    unsubscribers.push(
      cacheSyncService.on('connected', (data) => {
        isConnected.value = true
        clientId.value = data.client_id
        lastEvent.value = data
        error.value = null
      })
    )

    unsubscribers.push(
      cacheSyncService.on('open', () => {
        isConnected.value = true
      })
    )

    unsubscribers.push(
      cacheSyncService.on('close', () => {
        isConnected.value = false
        clientId.value = null
      })
    )

    unsubscribers.push(
      cacheSyncService.on('error', (err) => {
        error.value = err
      })
    )

    unsubscribers.push(
      cacheSyncService.on('activity', (data) => {
        lastEvent.value = data
      })
    )
  })

  onUnmounted(() => {
    // Cleanup all subscriptions
    unsubscribers.forEach((unsubscribe) => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    })
  })

  /**
   * Subscribe to a specific SSE event
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   * @returns {Function} Unsubscribe function
   */
  function subscribe(event, callback) {
    const unsubscribe = cacheSyncService.on(event, callback)
    unsubscribers.push(unsubscribe)
    return unsubscribe
  }

  return {
    isConnected,
    clientId,
    connectionState,
    lastEvent,
    error,
    subscribe
  }
}

export default useSSE
