/* eslint-disable no-unused-vars */
import { useLoadingStore } from '@/stores/loading'
import { inject } from 'vue'
import { AnalyticsTrackerAdapter } from '@/plugins/adapters/AnalyticsTrackerAdapter'

/** @type {import('vue-router').NavigationHookAfter} */
export default function afterEachRoute(to, from, failure) {
  const loadingStore = useLoadingStore()
  loadingStore.finishLoading()
  /** @type {AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  tracker
    .pageLoad({
      url: to.fullPath
    })
    .track()
}
