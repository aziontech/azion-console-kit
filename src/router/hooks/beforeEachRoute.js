import {
  logoutGuard,
  accountGuard,
  themeGuard,
  billingGuard,
  redirectGuard,
  flagGuard
} from '@/router/hooks/guards'
import { useRouter } from 'vue-router'
import { useLoadingStore } from '@/stores/loading'

export default async function beforeEachRoute(guardDependency) {
  const router = useRouter()
  const { next } = guardDependency
  const loadingStore = useLoadingStore()

  // Inicia o loading quando a navegação começa
  loadingStore.startLoading()

  const guards = [logoutGuard, themeGuard, accountGuard, billingGuard, redirectGuard, flagGuard]

  for (const executeGuard of guards) {
    const result = await executeGuard({ ...guardDependency, router })
    if (result !== undefined) {
      return next(result)
    }
  }

  return next()
}
