import { computed } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { useAccountStore } from '@/stores/account'
import { useServiceOrders } from '@/composables/useServiceOrders'
import { ensureServiceOrdersList, getCurrentServiceOrder } from '@/composables/useServiceOrdersList'
import { ensurePlansList, getPlanPricingId } from '@/composables/usePlansService'
import { SO_STATUS } from '@/services/v2/service-orders/service-orders-constants'
import { loadUserAndAccountInfo } from '@/helpers/account-data'

const extractSecret = (response) =>
  response?.payment?.clientSecret ||
  response?.data?.payment?.clientSecret ||
  response?.data?.clientSecret ||
  response?.serviceOrder?.clientSecret ||
  ''

/**
 * Prepares a Stripe checkout session for the requested plan/cycle. Uses
 * the existing draft service order when it matches; otherwise issues the
 * appropriate create/update/upgrade mutation. Concurrent invocations with
 * the same arguments dedupe through Vue Query's mutation cache — no manual
 * in-flight tracking required.
 */
export function useCheckoutSessionPreparer() {
  const accountStore = useAccountStore()
  const { createServiceOrder, updateServiceOrder, upgrade } = useServiceOrders()

  const prepareMutation = useMutation({
    mutationFn: async ({ plan, cycle }) => {
      const plans = await ensurePlansList()

      if (!accountStore.accountData?.country) {
        await loadUserAndAccountInfo()
      }

      const accountId = accountStore.accountData?.id
      if (!accountId) {
        throw new Error('Account data not available yet.')
      }

      const planId = plans?.find((item) => item.sku?.toLowerCase() === plan.toLowerCase())?.id
      const planPricingId = getPlanPricingId(plans, plan, cycle)

      if (!planId || !planPricingId) {
        throw new Error(`Plan pricing not found for ${plan} (${cycle}).`)
      }

      await ensureServiceOrdersList(accountId)
      const currentSO = getCurrentServiceOrder(accountId)

      if (currentSO?.status === SO_STATUS.DRAFT && currentSO.serviceOrderId) {
        const draftMatchesTarget =
          currentSO.planId === planId &&
          currentSO.priceId === planPricingId &&
          currentSO.clientSecret
        if (draftMatchesTarget) return currentSO.clientSecret

        const updateResponse = await updateServiceOrder(currentSO.serviceOrderId, {
          planId,
          planPricingId
        })
        const refreshedSecret = extractSecret(updateResponse)
        if (refreshedSecret) return refreshedSecret
        throw new Error('Unable to refresh the existing checkout session.')
      }

      const response =
        currentSO?.status === SO_STATUS.ACTIVE && currentSO.serviceOrderId
          ? await upgrade({
              id: currentSO.serviceOrderId,
              accountId,
              newPlanId: planId,
              priceId: planPricingId
            })
          : await createServiceOrder({ planId, planPricingId })

      const secret = extractSecret(response)
      if (!secret) {
        throw new Error('Payment session client secret missing in response.')
      }
      return secret
    }
  })

  const prepare = ({ plan, preferredCycle = null }) =>
    prepareMutation.mutateAsync({ plan, cycle: preferredCycle || 'monthly' })

  return {
    isPreparing: computed(() => prepareMutation.isPending.value),
    prepare
  }
}
