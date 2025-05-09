import { hasFlagBlockApiV4 } from '@/composables/user-flag'

/** @type {import('vue-router').NavigationGuardWithThis} */
export async function flagGuard({ to }) {
  const checkFlag = to.meta?.flag

  const checkV3ToAccessV4 = checkFlag === 'checkout_access' && !hasFlagBlockApiV4()
  const checkV4ToAccessV3 = checkFlag === 'checkout_access_without_flag' && hasFlagBlockApiV4()

  if (checkV4ToAccessV3 || checkV3ToAccessV4) {
    return '/not-found'
  }

  return true
}
