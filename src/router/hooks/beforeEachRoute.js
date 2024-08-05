import {
  logoutGuard,
  loadingGuard,
  accountGuard,
  themeGuard,
  billingGuard
} from '@/router/hooks/guards'
import { useHelpCenterStore } from '@/stores/help-center'

/** @type {import('vue-router').NavigationGuardWithThis} */
export default async function beforeEachRoute(to, from, next) {
  const helpCenterStore = useHelpCenterStore()
  helpCenterStore.close()

  await logoutGuard(to, next)
  loadingGuard(to)
  await accountGuard(to, next)
  themeGuard()
  billingGuard(to, next)

  return next()
}
