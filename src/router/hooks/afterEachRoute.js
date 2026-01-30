/* eslint-disable no-unused-vars */
import { useLoadingStore } from '@/stores/loading'
import { useAccountStore } from '@/stores/account'
import { inject } from 'vue'

/** @type {import('vue-router').NavigationHookAfter} */
export default function afterEachRoute(to, from, failure) {
  const loadingStore = useLoadingStore()
  const { hasActiveUserId, userId } = useAccountStore()
  loadingStore.finishLoading()

  if (failure || !hasActiveUserId) return
  /** @type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  tracker.product
    .pageLoad({
      url: to.fullPath
    })
    .track()
  tracker.identify(userId)
}
