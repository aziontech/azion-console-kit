import {
  logoutGuard,
  loadingGuard,
  accountGuard,
  themeGuard,
  billingGuard,
  redirectGuard,
  redirectToManagerGuard,
  ssoManagementGuard
} from '@/router/hooks/guards'
import { useHelpCenterStore } from '@/stores/help-center'
import { useRouter } from 'vue-router'

export default async function beforeEachRoute(guardDependency) {
  useHelpCenterStore().close()
  const router = useRouter()
  const { next } = guardDependency

  const guards = [
    logoutGuard,
    loadingGuard,
    accountGuard,
    ssoManagementGuard,
    themeGuard,
    billingGuard,
    redirectGuard,
    redirectToManagerGuard
  ]

  for (const executeGuard of guards) {
    const result = await executeGuard({ ...guardDependency, router })
    if (result !== undefined) {
      return next(result)
    }
  }

  return next()
}
