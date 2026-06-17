import { ref } from 'vue'
import { useAccountStore } from '@/stores/account'
import { useServiceOrders } from '@/composables/useServiceOrders'
import { ensurePlansList, getPlanPricingId } from '@/composables/usePlansService'
import { SO_STATUS } from '@/services/v2/service-orders/service-orders-constants'
import { loadUserAndAccountInfo } from '@/helpers/account-data'

export function useCheckoutSessionPreparer() {
  const accountStore = useAccountStore()
  const {
    serviceOrder,
    createServiceOrder,
    updateServiceOrder,
    upgrade,
    loadAccountServiceOrders
  } = useServiceOrders()

  const isPreparing = ref(false)

  const extractSecret = (response) =>
    response?.payment?.clientSecret ||
    response?.data?.payment?.clientSecret ||
    response?.data?.clientSecret ||
    response?.serviceOrder?.clientSecret ||
    ''

  let inFlightPromise = null
  let inFlightKey = ''

  const ensureCurrentServiceOrder = async (accountId) => {
    if (serviceOrder.value) return serviceOrder.value
    await loadAccountServiceOrders(accountId)
    return serviceOrder.value
  }

  const runPrepare = async ({ plan, cycle }) => {
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

    const currentSO = await ensureCurrentServiceOrder(accountId)

    if (currentSO?.status === SO_STATUS.DRAFT && currentSO.serviceOrderId) {
      if (
        currentSO.planId === planId &&
        currentSO.priceId === planPricingId &&
        currentSO.clientSecret
      ) {
        return currentSO.clientSecret
      }

      const updateResponse = await updateServiceOrder(currentSO.serviceOrderId, {
        accountId,
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
        : await createServiceOrder({ accountId, planId, planPricingId })

    const secret = extractSecret(response)
    if (!secret) {
      throw new Error('Payment session client secret missing in response.')
    }
    return secret
  }

  const prepare = async ({ plan, preferredCycle = null }) => {
    const cycle = preferredCycle || 'monthly'
    const key = `${plan}:${cycle}`

    if (inFlightPromise && inFlightKey === key) {
      return inFlightPromise
    }

    while (inFlightPromise) {
      const prior = inFlightPromise
      try {
        await prior
      } catch {
        /* */
      }
      if (inFlightPromise === prior) break
    }

    if (inFlightPromise && inFlightKey === key) {
      return inFlightPromise
    }

    inFlightKey = key
    isPreparing.value = true
    inFlightPromise = runPrepare({ plan, cycle }).finally(() => {
      inFlightPromise = null
      inFlightKey = ''
      isPreparing.value = false
    })

    return inFlightPromise
  }

  return {
    isPreparing,
    prepare
  }
}
