import {
  logoutGuard,
  accountGuard,
  themeGuard,
  billingGuard,
  redirectGuard,
  flagGuard
} from '@/router/hooks/guards'
import { useRouter } from 'vue-router'

export default async function beforeEachRoute(guardDependency) {
  const router = useRouter()
  const { next } = guardDependency

  const guards = [logoutGuard, accountGuard, themeGuard, billingGuard, redirectGuard, flagGuard]

  for (const executeGuard of guards) {
    const result = await executeGuard({ ...guardDependency, router })
    if (result !== undefined) {
      return next(result)
    }
  }

  return next()
}
