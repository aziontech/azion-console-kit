import { hasFlagBlockApiV4 } from '@/composables/user-flag'

/** @type {import('vue-router').NavigationGuardWithThis} */
export async function flagGuard({ to }) {
  const checkFlag = to.meta?.flag

  if (checkFlag === 'checkout_access' && hasFlagBlockApiV4()) {
    return '/not-found'
  }

  return true
}
