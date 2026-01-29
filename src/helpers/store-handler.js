import { onSwitchAccount } from '@/services/v2/base/auth/session-broadcast'
import { useAccountStore } from '@/stores/account'

window.addEventListener('storage', handleStorageChange)

function handleStorageChange(event) {
  if (event.key !== '__user_traits') return

  const { newValue, oldValue } = event
  const isNewValueDifferent = JSON.parse(newValue).client_id !== JSON.parse(oldValue).client_id

  if (isNewValueDifferent) {
    window.location.reload()
  }
}

onSwitchAccount(async () => {
  const accountStore = useAccountStore()
  accountStore.resetAccount()

  window.location.reload()
})
