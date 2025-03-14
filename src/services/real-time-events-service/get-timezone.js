import { useAccountStore } from '@stores/account'

export const getUserTimezone = () => {
  const accountStore = useAccountStore()
  const { timezone } = accountStore.accountData

  return timezone
}
