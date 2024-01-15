import * as AuthServices from '@/services/auth-services'
import { listTypeAccountService } from '@/services/switch-account-services/list-type-account-service'
import { AccountHandler } from './account-handler'

const verify = async () => {
  try {
    return await AuthServices.verifyAuthenticationService()
  } catch {
    await refresh()
  }
}

const refresh = async () => {
  try {
    await AuthServices.refreshAuthenticationService()
  } catch {
    throw new Error()
  }
}

const switchClientAccount = async ({ account_id }) => {
  const accountHandler = new AccountHandler(
    AuthServices.switchAccountService,
    listTypeAccountService
  )
  try {
    const redirect = await accountHandler.switchAndReturnAccountPage(account_id)
    return redirect
  } catch {
    throw new Error()
  }
}

export const switchAccountFromSocialIdp = async () => {
  const { twoFactor, trustedDevice, user_tracking_info: userInfo } = await verify()

  if (!userInfo) {
    return '/login'
  }

  if (twoFactor) {
    const mfaRoute = trustedDevice ? 'authentication' : 'setup'
    return `/mfa/${mfaRoute}`
  }

  return switchClientAccount(userInfo)
}
