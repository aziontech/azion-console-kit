import * as guards from '@/router/hooks/guards'
import { useHelpCenterStore } from '@/stores/help-center'
import { useRouter } from 'vue-router'

/** @type {import('vue-router').NavigationGuardWithThis} */
export default async function beforeEachRoute(to, from, next) {
  const helpCenterStore = useHelpCenterStore()
  helpCenterStore.close()
  const router = useRouter()
  await guards.logoutGuard(to, next)
  guards.loadingGuard(to)
  await guards.accountGuard(to, next)
  guards.themeGuard()
  guards.billingGuard(to, next)
  guards.redirectGuard(to, next, router)

  return next()
}
