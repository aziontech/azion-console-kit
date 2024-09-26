import * as guards from '@/router/hooks/guards'
import { useHelpCenterStore } from '@/stores/help-center'
import { useRouter } from 'vue-router'

export default async function beforeEachRoute(routeHandler, guardDependency) {
  const { to, next } = routeHandler
  const { accountStore } = guardDependency

  const helpCenterStore = useHelpCenterStore()
  helpCenterStore.close()
  const router = useRouter()
  await guards.logoutGuard(to, next, accountStore)
  guards.loadingGuard(to)
  await guards.accountGuard(to, next, accountStore)
  guards.themeGuard(accountStore)
  guards.billingGuard(to, next, accountStore)
  guards.redirectGuard(to, next, router)

  return next()
}
