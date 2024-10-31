import {
  logoutGuard,
  loadingGuard,
  accountGuard,
  themeGuard,
  billingGuard,
  redirectGuard,
  redirectToManagerGuard
} from '@/router/hooks/guards'
import { useLayout } from '@/composables/use-layout'
import { useRouter } from 'vue-router'

export default async function beforeEachRoute(guardDependency) {
  
  const { closeSidebar } = useLayout()
  closeSidebar()
  const router = useRouter()
  const { next } = guardDependency

  const guards = [
    logoutGuard,
    loadingGuard,
    accountGuard,
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
