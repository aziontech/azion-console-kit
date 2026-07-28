import { computed } from 'vue'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { paymentMethodsService } from '@/services/v2/billing-api/payment-methods/payment-methods-service'
import { PAYMENT_METHOD_TYPE } from '@/services/v2/billing-api/payment-methods/payment-methods-constants'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { isNotFound } from '@/services/v2/utils/is-not-found'

const UNAVAILABLE = { paymentMethods: [], defaultPaymentMethod: null, unavailable: true }

const normalize = (methods) => {
  const paymentMethods = Array.isArray(methods) ? methods : []
  return {
    paymentMethods,
    defaultPaymentMethod: paymentMethods.find((method) => method.isDefault) ?? null
  }
}

const fetchWallet = async () => {
  try {
    return normalize(await paymentMethodsService.listPaymentMethods())
  } catch (error) {
    if (isNotFound(error)) return UNAVAILABLE
    throw error
  }
}

export const walletQueryKey = () => queryKeys.paymentMethods.list()

export const invalidateWallet = () =>
  queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods.all })

/**
 * Card wallet for the plans experience — billing-api v4. The list is read live
 * from the gateway and comes back as a raw array (no v4 envelope).
 */
export function useWallet(options = {}) {
  const { enabled = true } = options

  const query = useQuery({
    queryKey: walletQueryKey(),
    queryFn: fetchWallet,
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

/**
 * Card capture and default/removal mutations — billing-api v4.
 *
 * `createSetupIntent` opens a gateway setup session; the PAN never reaches
 * billing-api. Committing a plan after a capture is the caller's job, via
 * `useSubscriptionPlanChange().applyChange`.
 */
export function useWalletMutations() {
  const setupSessionMutation = useMutation({
    mutationFn: async () => {
      const session = await paymentMethodsService.createSetupSession({
        type: PAYMENT_METHOD_TYPE.CARD
      })
      return {
        state: session?.state ?? null,
        clientSecret: session?.data?.clientSecret ?? null,
        setupSessionId: session?.data?.setupSessionId ?? null,
        gateway: session?.data?.gateway ?? null
      }
    }
  })

  const setDefaultMutation = useMutation({
    mutationFn: (paymentMethodId) => paymentMethodsService.setDefaultPaymentMethod(paymentMethodId),
    onSuccess: invalidateWallet
  })

  const removeMutation = useMutation({
    mutationFn: (paymentMethodId) => paymentMethodsService.deletePaymentMethod(paymentMethodId),
    onSuccess: invalidateWallet
  })

  return {
    createSetupIntent: () => setupSessionMutation.mutateAsync(),
    setDefault: (paymentMethodId) => setDefaultMutation.mutateAsync(paymentMethodId),
    removePaymentMethod: (paymentMethodId) => removeMutation.mutateAsync(paymentMethodId),
    isWorking: computed(
      () =>
        setupSessionMutation.isPending.value ||
        setDefaultMutation.isPending.value ||
        removeMutation.isPending.value
    )
  }
}
