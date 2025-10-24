import { hasFlagBlockApiV4, hasFlagIsAzionEmail } from '@/composables/user-flag'

/** @type {import('vue-router').NavigationGuardWithThis} */
export async function flagGuard({ to }) {
  if (to.meta?.isPublic) {
    return true
  }

  const checkFlag = to.meta?.flag
  const checkV3ToAccessV4 = checkFlag === 'checkout_access' && !hasFlagBlockApiV4()
  const checkV4ToAccessV3 = checkFlag === 'checkout_access_without_flag' && hasFlagBlockApiV4()
  const checkAzionEmail = checkFlag === 'only_azion_email' && !hasFlagIsAzionEmail()

  if (checkV4ToAccessV3 || checkV3ToAccessV4 || checkAzionEmail) {
    return '/not-found'
  }

  return true
}
