/* eslint-disable no-unused-vars */
import { useLoadingStore } from '@/stores/loading'
import { useAccountStore } from '@/stores/account'
import { inject } from 'vue'
import { sessionManager } from '@/services/v2/base/auth'

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
  try {
    tracker
      .page(typeof to.name === 'string' ? to.name : undefined, {
        path: to.fullPath,
        title: typeof document !== 'undefined' ? document.title : undefined
      })
      ?.catch?.(() => {})
  } catch {
    // intentionally swallowed
  }

  const isOnboardingStep = to.name === 'additional-data'

  if (!isOnboardingStep) {
    sessionManager.afterLogin()
  }
}
