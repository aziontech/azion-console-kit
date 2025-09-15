/* eslint-disable no-unused-vars */
import { useLoadingStore } from '@/stores/loading'
import { useAccountStore } from '@/stores/account'
import { inject, getCurrentInstance } from 'vue'
import { loadProfileAndAccountInfo } from '@/helpers/account-data'

/** @type {import('vue-router').NavigationHookAfter} */
export default function afterEachRoute(to, from, failure) {
  const loadingStore = useLoadingStore()
  const { hasActiveUserId, userId } = useAccountStore()
  const instance = getCurrentInstance()
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

  if (instance.appContext.config.globalProperties.$sentry && userId) {
    instance.appContext.config.globalProperties.$sentry.setUser({
      id: userId
    })
  }

  loadProfileAndAccountInfo()
}
