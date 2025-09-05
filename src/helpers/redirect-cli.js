import { storeToRefs } from 'pinia'
import { useAccountStore } from '@/stores/account'
import { convertDateToLocalTimezone } from './convert-date'
import { setWithExpiration, getWithExpiration } from './local-storage-manager'
import * as PersonalTokensService from '@/services/personal-tokens-services'
const REDIRECT_TO_LOCALHOST = 'http://localhost:'

/**
 * Sets up CLI configuration in localStorage
 * @param {number} [expirationMinutes=2] - Expiration time in minutes
 */
export const setupCLIConfig = (expirationMinutes = 2, callbackPort = 8080) => {
  setWithExpiration({
    key: 'CLI',
    value: true,
    expirationMinutes
  })
  setWithExpiration({
    key: 'callbackPort',
    value: callbackPort,
    expirationMinutes
  })
}

function expiresDate() {
  const currentDate = new Date()
  currentDate.setDate(currentDate.getDate() + 365)
  const value = currentDate

  // utc_offset
  const store = useAccountStore()
  const { account } = storeToRefs(store)
  const userUtcOffset = account.value.utc_offset

  return convertDateToLocalTimezone(value, userUtcOffset)
}

/**
 * Handles CLI redirect if configuration exists
 * @returns {string|null} - Returns redirect URL if CLI config exists, null otherwise
 */
export const handleCLIRedirect = async () => {
  const redirectCLI = getWithExpiration('CLI')
  const callbackPort = getWithExpiration('callbackPort')
  if (redirectCLI) {
    const CONFIG_TOKEN = {
      name: 'cliPersonalToken',
      description: '',
      expiresAt: expiresDate()
    }
    const { token } = await PersonalTokensService.createPersonalToken(CONFIG_TOKEN)
    return `${REDIRECT_TO_LOCALHOST}${callbackPort}/?c=${token}`
  }

  return null
}
