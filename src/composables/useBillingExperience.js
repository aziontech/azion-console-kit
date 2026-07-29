import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAccountStore } from '@/stores/account'
import { useSubscriptionState } from '@/composables/useSubscriptionState'

export function useBillingExperience() {
  const accountStore = useAccountStore()
  const {
    billingType,
    isBillingTypeOverridden,
    accountMode,
    billingExperience,
    isManagedBillingAccount
  } = storeToRefs(accountStore)

  const isDecidedByAccount = computed(
    () => isBillingTypeOverridden.value || billingType.value !== null || accountMode.value !== null
  )

  const { subscriptionQuery } = useSubscriptionState({
    enabled: computed(() => !isDecidedByAccount.value)
  })

  const isResolved = computed(() => {
    if (isDecidedByAccount.value) return true
    return subscriptionQuery.data.value !== undefined || subscriptionQuery.isError.value === true
  })

  return {
    billingExperience,
    isManagedBillingAccount,
    isResolved
  }
}
