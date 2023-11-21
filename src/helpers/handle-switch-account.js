import { AccountNotFoundError } from '@/services/axios/errors/account-not-found-error'

export class AccountHandler {
  constructor(switchAccountService, listTypeAccountService) {
    this.switchAccountService = switchAccountService
    this.listTypeAccountService = listTypeAccountService
  }

  //deprecated: method will be replaced by an api in the future
  async searchAccount(id) {
    if (id) return id

    const accountTypes = ['brands', 'resellers', 'groups', 'clients']

    for (const accountType of accountTypes) {
      const { results: [firstResult] = [] } = await this.listTypeAccountService({
        type: accountType,
        pageSize: 1
      })

      if (firstResult && firstResult.accountId) {
        return firstResult.accountId
      }
    }

    throw new AccountNotFoundError().message
  }

  async switchAndReturnAccountPage(clientId) {
    const accountId = await this.searchAccount(clientId)

    const { firstLogin } = await this.switchAccountService(accountId)
    if (firstLogin) {
      return { name: 'additional-data' }
    }
    return { name: 'home' }
  }
}
