import { ref } from 'vue'
import { serviceOrdersService } from '@/services/v2/service-orders/service-orders-service'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { SO_MESSAGES, SO_STATUS } from '@/services/v2/service-orders/service-orders-constants'
import {
  SUBMIT_ACTIONS,
  isDraftPatchable,
  resolveSubmitStrategy
} from '@/services/v2/service-orders/service-orders-strategy'

const serviceOrder = ref(null)
const isLoading = ref(false)
const isSubmitting = ref(false)

const setServiceOrderFromResponse = (response) => {
  if (response?.data) serviceOrder.value = response.data
}

const runSubmission = async (operation) => {
  isSubmitting.value = true
  try {
    return await operation()
  } finally {
    isSubmitting.value = false
  }
}

const fetchServiceOrdersByStatus = (accountId, status) =>
  queryClient.fetchQuery({
    queryKey: queryKeys.serviceOrders.list({ accountId, status }),
    queryFn: () => serviceOrdersService.listServiceOrders({ accountId, status }),
    staleTime: 0
  })

/**
 * Composable for managing service orders in signup/plan subscription flow.
 * Singleton state shared across views — billing drawer and signup wizard
 * mutate the same SO snapshot. Reads go through the Vue Query cache for
 * concurrent-call deduplication; mutations invalidate
 * `queryKeys.serviceOrders.all` at the service layer.
 */
export function useServiceOrders() {
  /**
   * Load the most relevant service order for an account.
   *
   * When multiple SOs exist (e.g. Hobby ACTIVE + Pro DRAFT), prefer DRAFT
   * (mutation target). Pass `{ noFallback: true }` when only the preferred
   * status can possibly exist (onboarding) to skip the second list call.
   */
  const loadServiceOrder = async (accountId, options = {}) => {
    if (!accountId) {
      serviceOrder.value = null
      return
    }

    const { preferStatus = SO_STATUS.DRAFT, noFallback = false } = options
    const fallbackStatus = preferStatus === SO_STATUS.DRAFT ? SO_STATUS.ACTIVE : SO_STATUS.DRAFT

    isLoading.value = true

    try {
      const preferredResponse = await fetchServiceOrdersByStatus(accountId, preferStatus)
      let so = preferredResponse?.data?.[0] ?? null

      if (!so && !noFallback) {
        const fallbackResponse = await fetchServiceOrdersByStatus(accountId, fallbackStatus)
        so = fallbackResponse?.data?.[0] ?? null
      }

      serviceOrder.value = so
    } catch (err) {
      serviceOrder.value = null
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createServiceOrder = (payload) =>
    runSubmission(async () => {
      const response = await serviceOrdersService.createServiceOrder(payload)
      setServiceOrderFromResponse(response)
      return response
    })

  const updateServiceOrder = (id, payload) =>
    runSubmission(async () => {
      const response = await serviceOrdersService.updateServiceOrder(id, payload)
      setServiceOrderFromResponse(response)
      return response
    })

  /**
   * Submit service order — picks the right endpoint based on current SO state:
   *   - no SO                                → POST /service_orders          (signup)
   *   - DRAFT exists                         → PATCH /service_orders/:id     (edit DRAFT)
   *   - ACTIVE + plan change                 → PATCH /:id/upgrade            (upgrade/downgrade)
   *   - ACTIVE + same plan + price change    → POST /service_orders          (new DRAFT for cycle change)
   *   - ACTIVE + same plan + same price      → no-op                         (nothing to commit)
   */
  const submitServiceOrder = async ({ accountId, planId, planPricingId }) => {
    const { action } = resolveSubmitStrategy({
      currentSO: serviceOrder.value,
      planId,
      planPricingId
    })

    switch (action) {
      case SUBMIT_ACTIONS.PATCH:
        return updateServiceOrder(serviceOrder.value.serviceOrderId, {
          accountId,
          planId,
          planPricingId
        })

      case SUBMIT_ACTIONS.UPGRADE:
        return upgrade({
          id: serviceOrder.value.serviceOrderId,
          accountId,
          newPlanId: planId,
          priceId: planPricingId
        })

      case SUBMIT_ACTIONS.CREATE:
        return createServiceOrder({ accountId, planId, planPricingId })

      case SUBMIT_ACTIONS.NOOP:
      default:
        return { success: true, data: serviceOrder.value, payment: undefined }
    }
  }

  /**
   * Update only planPricingId of an existing DRAFT service order.
   * Used by the drawer to refresh the Stripe checkout session when the user
   * toggles billing cycle on a pending subscription.
   */
  const updatePlanPricing = async (planPricingId) => {
    const so = serviceOrder.value
    if (!so?.serviceOrderId) return
    if (!isDraftPatchable(so)) return
    if (so.priceId && so.priceId === planPricingId) return

    return runSubmission(async () => {
      const response = await serviceOrdersService.updateServiceOrder(so.serviceOrderId, {
        accountId: so.accountId,
        planId: so.planId,
        planPricingId
      })
      setServiceOrderFromResponse(response)
      return response
    })
  }

  /**
   * Transition an active service order to a different plan (upgrade or downgrade).
   * Backend requires `priceId` whenever the target plan is paid; omit for free plans.
   */
  const upgrade = async ({ id, accountId, newPlanId, priceId }) => {
    const serviceOrderId = id || serviceOrder.value?.serviceOrderId
    if (!serviceOrderId) {
      throw new Error(SO_MESSAGES.MISSING_SERVICE_ORDER_ID)
    }

    return runSubmission(async () => {
      const response = await serviceOrdersService.upgradeServiceOrder({
        id: serviceOrderId,
        payload: { accountId, newPlanId, priceId }
      })

      if (response?.serviceOrder) {
        serviceOrder.value = response.serviceOrder
      }

      // Best-effort: re-list to capture the fresh DRAFT the backend may have
      // created (e.g. cycle change on an active SO). Failure is ignored —
      // the upgrade response above already succeeded.
      if (accountId) {
        try {
          const listResp = await fetchServiceOrdersByStatus(accountId, SO_STATUS.DRAFT)
          const draft = listResp?.data?.[0] ?? null
          if (draft) {
            serviceOrder.value = draft
            if (!response?.payment?.clientSecret && draft.priceId) {
              response.serviceOrder = draft
            }
          }
        } catch {
          /* re-list is opportunistic; primary upgrade response stands */
        }
      }

      return response
    })
  }

  /**
   * Schedule a downgrade — backend transitions at end of current billing
   * period and returns the SO with the Stripe subscription_schedule reference.
   */
  const downgrade = async ({ id, newPlanId }) => {
    const serviceOrderId = id || serviceOrder.value?.serviceOrderId
    if (!serviceOrderId) {
      throw new Error(SO_MESSAGES.MISSING_SERVICE_ORDER_ID)
    }

    return runSubmission(async () => {
      const response = await serviceOrdersService.downgradeServiceOrder({
        id: serviceOrderId,
        payload: { newPlanId }
      })
      if (response?.serviceOrder) {
        serviceOrder.value = response.serviceOrder
      }
      return response
    })
  }

  const getServiceOrder = async (id) => {
    if (!id) return null
    const response = await queryClient.fetchQuery({
      queryKey: queryKeys.serviceOrders.detail(id),
      queryFn: () => serviceOrdersService.getServiceOrder(id),
      staleTime: 0
    })
    const so = response?.data ?? null
    if (so) serviceOrder.value = so
    return so
  }

  return {
    serviceOrder,
    isLoading,
    isSubmitting,

    loadServiceOrder,
    getServiceOrder,
    createServiceOrder,
    updateServiceOrder,
    submitServiceOrder,
    updatePlanPricing,
    upgrade,
    downgrade
  }
}
