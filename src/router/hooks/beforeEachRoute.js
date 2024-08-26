import * as guards from '@/router/hooks/guards'
import { useHelpCenterStore } from '@/stores/help-center'

/** @type {import('vue-router').NavigationGuardWithThis} */
export default async function beforeEachRoute(to, from, next) {
  const helpCenterStore = useHelpCenterStore()
  helpCenterStore.close()

  await guards.logoutGuard(to, next)
  guards.loadingGuard(to)
  await guards.accountGuard(to, next)
  guards.themeGuard()
  guards.billingGuard(to, next)
  guards.redirectAuth(to, next)
  return next()
}

/*
 logout guard
 -->true /logoin
 -->false next
loading guard
-->true next
-->false next
account guard
-->true next
-->false /login
theme guard
-->true next
-->false next
billing guard
-->true next
