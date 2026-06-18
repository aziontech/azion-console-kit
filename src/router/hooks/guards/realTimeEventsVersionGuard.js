import { useRealTimeEventsPreferenceStore } from '@/stores/real-time-events-preference'

export function realTimeEventsVersionGuard({ to }) {
  const store = useRealTimeEventsPreferenceStore()

  if (to.name === 'real-time-events' && to.params.tab === 'v2') {
    store.setVersion('v2')
    return {
      name: 'real-time-events-v2',
      query: to.query
    }
  }

  if (to.name === 'real-time-events-v2') {
    if (store.viewVersion !== 'v2') store.setVersion('v2')
    return
  }

  if (to.name === 'real-time-events') {
    if (store.viewVersion === 'v2') {
      return {
        name: 'real-time-events-v2',
        query: to.query
      }
    }
    store.setVersion('v1')
  }
}
