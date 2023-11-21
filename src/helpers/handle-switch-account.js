import { listTypeAccountService } from '@/services/switch-account-services/list-type-account-service'
import { switchAccountService } from '@/services/auth-services/switch-account-service'

//deprecated: method will be replaced by an api in the future
const searchAccount = async (id) => {
  if (id) return id

  const accountTypes = ['brands', 'resellers', 'groups', 'clients']

  for (const accountType of accountTypes) {
    const { results: [firstResult] = [] } = await listTypeAccountService({
      type: accountType,
      page_size: 1
    })

    if (firstResult && firstResult.accountId) {
      return firstResult.accountId
    }
  }
  
  throw new Error('No account found')
}

export const switchAccountLogin = async (clientId) => {
  const accountId = await searchAccount(clientId)

  const { first_login: firstLogin } = await switchAccountService(accountId)
  if (firstLogin) {
    return { name: 'additional-data' }
  }
  return { name: 'home' }
}
