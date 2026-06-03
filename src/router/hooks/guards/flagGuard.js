import { hasFlagBlockApiV4, hasFlagUseV6Configurations } from '@/composables/user-flag'

/** @type {import('vue-router').NavigationGuardWithThis} */
export function flagGuard({ to }) {
  if (to.meta?.isPublic) {
    return true
  }

  const checkFlag = to.meta?.flag
  const checkV3ToAccessV4 = checkFlag === 'checkout_access' && !hasFlagBlockApiV4()
  const checkV4ToAccessV3 = checkFlag === 'checkout_access_without_flag' && hasFlagBlockApiV4()
  const checkRequiresV6 = checkFlag === 'use_v6_configurations' && !hasFlagUseV6Configurations()

  if (checkV4ToAccessV3 || checkV3ToAccessV4 || checkRequiresV6) {
    return '/not-found'
  }

  return true
}
