/* eslint-disable no-unused-vars */
import { useLoadingStore } from '@/stores/loading'
import { inject } from 'vue'

/** @type {import('vue-router').NavigationHookAfter} */
export default function afterEachRoute(to, from, failure) {
  const loadingStore = useLoadingStore()
  loadingStore.finishLoading()
  /** @type {import('@/plugins/adapters/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  tracker
    .pageLoad({
      url: to.fullPath
    })
    .track()
}
