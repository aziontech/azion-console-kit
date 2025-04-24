import { computed } from 'vue'
import { useAccountStore } from '../stores/account'

export function useFlag(flagName) {
  const accountStore = useAccountStore()
  const flags = computed(() => accountStore.userFlags || [])
  return computed(() => {
    if (!flagName) return false
    return flags.value.includes(flagName)
  })
}

export function hasFlagBlockApiV4() {
  const FLAG = 'block_apiv4_uncompatible_endpoints'
  return useFlag(FLAG).value
}
