import { AccountNotFoundError } from '@/services/axios/errors/account-not-found-error'

export class AccountHandler {
  constructor(switchAccountService, listTypeAccountService) {
    this.switchAccountService = switchAccountService
    this.listTypeAccountService = listTypeAccountService
  }

  /**
   * Searches for an account based on the client ID.
   * If no ID is provided, it looks for the first available account of predefined types.
   * deprecated: method will be replaced by an api in the future
   * @param {string} id - Client ID
   * @returns {Promise<string>} - Returns the found account ID
   * @throws {AccountNotFoundError} - Throws an error if no account is found
   */
  async searchAccount(id) {
    if (id) return id

    const accountTypes = ['brands', 'resellers', 'groups', 'clients']

    for (const accountType of accountTypes) {
      const { results: [firstResult] = [] } = await this.listTypeAccountService({
        type: accountType,
        pageSize: 1
      })

      if (firstResult?.accountId) {
        return firstResult.accountId
      }
    }

    throw new AccountNotFoundError().message
  }

  /**
   * Switches the account based on the client ID and returns the corresponding page.
   * @param {string} clientId - Client ID
   * @returns {Promise<Object>} - Returns an object with the corresponding page name
   */
  async switchAndReturnAccountPage(clientId) {
    const accountId = await this.searchAccount(clientId)

    const { firstLogin } = await this.switchAccountService(accountId)
    return { name: firstLogin ? 'additional-data' : 'home' }
  }

  /**
   * Switches the account based on the account ID and redirects to the corresponding page.
   * @param {string} accountId - Account ID
   */
  async switchAccountAndRedirect(accountId) {
    const { firstLogin } = await this.switchAccountService(accountId)

    if (firstLogin) {
      window.location = '/signup/additional-data'
      return
    }

    window.location.replace('/')
  }

  static async refresh(refreshService) {
    try {
      await refreshService()
    } catch {
      throw new Error()
    }
  }

  async switchAccountFromSocialIdp(verifyService, refreshService) {
    try {
      const { twoFactor, trustedDevice, user_tracking_info: userInfo } = await verifyService()

      if (!userInfo) {
        return '/login'
      }

      if (twoFactor) {
        const mfaRoute = trustedDevice ? 'authentication' : 'setup'
        return `/mfa/${mfaRoute}`
      }

      const { account_id: accountId } = userInfo.props

      return this.switchAndReturnAccountPage(accountId)
    } catch {
      await this.refresh(refreshService)
    }
  }
}
