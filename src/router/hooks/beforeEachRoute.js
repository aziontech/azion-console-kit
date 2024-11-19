import {
  logoutGuard,
  loadingGuard,
  accountGuard,
  themeGuard,
  billingGuard,
  redirectGuard,
  ssoManagementGuard,
  domainsLimitGuard
} from '@/router/hooks/guards'
import { useRouter } from 'vue-router'

export default async function beforeEachRoute(guardDependency) {
  const router = useRouter()
  const { next } = guardDependency

  const guards = [
    logoutGuard,
    loadingGuard,
    accountGuard,
    themeGuard,
    billingGuard,
    redirectGuard,
    ssoManagementGuard,
    domainsLimitGuard
  ]

  for (const executeGuard of guards) {
    const result = await executeGuard({ ...guardDependency, router })
    if (result !== undefined) {
      return next(result)
    }
  }

  return next()
}
