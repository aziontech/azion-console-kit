import { computed } from 'vue'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { legacyWalletService } from '@/services/v2/billing-legacy/wallet/legacy-wallet-service'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { isNotFound } from '@/services/v2/utils/is-not-found'

const UNAVAILABLE = { paymentMethods: [], defaultPaymentMethod: null, unavailable: true }

const fetchLegacyWallet = async () => {
  try {
    return await legacyWalletService.getBillingPaymentMethods()
  } catch (error) {
    if (isNotFound(error)) return UNAVAILABLE
    throw error
  }
}

export const legacyWalletQueryKey = () => queryKeys.billingLegacy.paymentMethods()

export const invalidateLegacyWallet = () =>
  queryClient.invalidateQueries({ queryKey: queryKeys.billingLegacy.all })

/**
 * Card wallet for the managed billing experience (`billing_type` `internal` /
 * `custom`), served by the legacy service-order surface.
 *
 * Frozen on purpose: managed accounts keep the old billing until the product
 * decides to move them. Do not add features here and do not import anything
 * from `services/v2/billing-api` — that is the plans experience.
 */
export function useLegacyWallet(options = {}) {
  const { enabled = true } = options

  const query = useQuery({
    queryKey: legacyWalletQueryKey(),
    queryFn: fetchLegacyWallet,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    meta: { persist: false },
    enabled
  })

  const paymentMethods = computed(() => query.data.value?.paymentMethods ?? [])
  const defaultPaymentMethod = computed(() => query.data.value?.defaultPaymentMethod ?? null)

  return {
    query,
    paymentMethods,
    defaultPaymentMethod,
    hasPaymentMethods: computed(() => paymentMethods.value.length > 0),
    isUnavailable: computed(() => query.data.value?.unavailable === true),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch
  }
}

export function useLegacyWalletMutations() {
  const setupIntentMutation = useMutation({
    mutationFn: () => legacyWalletService.createPaymentMethodSetupIntent()
  })

  const setDefaultMutation = useMutation({
    mutationFn: (paymentMethodId) => legacyWalletService.setDefaultPaymentMethod(paymentMethodId),
    onSuccess: invalidateLegacyWallet
  })

  return {
    createSetupIntent: () => setupIntentMutation.mutateAsync(),
    setDefault: (paymentMethodId) => setDefaultMutation.mutateAsync(paymentMethodId),
    isWorking: computed(
      () => setupIntentMutation.isPending.value || setDefaultMutation.isPending.value
    )
  }
}
