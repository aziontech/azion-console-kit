/* eslint-disable no-unused-vars */
import { useLoadingStore } from '@/stores/loading'
import { useAccountStore } from '@/stores/account'
import { inject } from 'vue'
import * as Sentry from '@sentry/vue'
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
  Promise.resolve()
    .then(() =>
      tracker.page(typeof to.name === 'string' ? to.name : undefined, {
        path: to.fullPath,
        title: typeof document !== 'undefined' ? document.title : undefined
      })
    )
    .catch(Sentry.captureException)

  const isOnboardingStep = to.name === 'additional-data'
  const isPublicRoute = to.meta?.isPublic === true
  const shouldSkipPrefetch = isOnboardingStep || isPublicRoute

  if (!shouldSkipPrefetch) {
    sessionManager.afterLogin()
  }
}