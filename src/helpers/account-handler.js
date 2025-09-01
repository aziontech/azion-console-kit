import { ProccessRequestError } from '@/services/axios/errors'
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

  /**
   * Refreshes the given refresh service.
   *
   * @param {Function} refreshService - The service to refreshed token.
   * @return {Promise} - A promise that resolves when the refresh is complete.
   * @throws {ProccessRequestError} - Throws an error if the refresh fails.
   */
  static async refresh(refreshService) {
    try {
      await refreshService()
    } catch {
      throw new ProccessRequestError().message
    }
  }

  /**
   * Asynchronously switches the account from a social IDP.
   *
   * @param {function} verifyService - The function that verifies the service.
   * @param {function} refreshService - The function that refreshes the service.
   * @return {string | object} The URL string or object to redirect to.
   */
  async switchAccountFromSocialIdp(verifyService, refreshService, EnableSocialLogin) {
    try {
      const { twoFactor, trustedDevice, user_tracking_info: userInfo } = await verifyService()

      if (!userInfo) {
        return '/login'
      }

      if (twoFactor && !EnableSocialLogin) {
        const mfaRoute = trustedDevice ? 'authentication' : 'setup'
        return `/mfa/${mfaRoute}`
      }

      const { account_id: accountId } = userInfo.props

      return this.switchAndReturnAccountPage(accountId)
    } catch {
      await AccountHandler.refresh(refreshService)
    }
  }
}
