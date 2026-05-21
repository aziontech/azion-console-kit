import { computed, ref } from 'vue'
import * as Sentry from '@sentry/vue'
// eslint-disable-next-line azion-architecture/require-vue-query
import { serviceOrdersService } from '@/services/v2/service-orders/service-orders-service'
import { useAccountStore } from '@/stores/account'
import { SO_MESSAGES, SO_STATUS } from '@/services/v2/service-orders/service-orders-constants'
import {
  SUBMIT_ACTIONS,
  resolveSubmitStrategy
} from '@/services/v2/service-orders/service-orders-strategy'
import {
  useServiceOrdersList,
  ensureServiceOrdersList,
  getCurrentServiceOrder,
  getDraftServiceOrder
} from '@/composables/useServiceOrdersList'

const isSubmitting = ref(false)

const runSubmission = async (operation) => {
  isSubmitting.value = true
  try {
    return await operation()
  } finally {
    isSubmitting.value = false
  }
}

export function useServiceOrders() {
  const accountStore = useAccountStore()
  const accountIdRef = computed(() => accountStore.accountData?.id ?? null)

  const { activeServiceOrder, draftServiceOrder, currentServiceOrder, isLoading, refetch } =
    useServiceOrdersList(accountIdRef)

  const loadAccountServiceOrders = async (id) => {
    const targetId = id ?? accountIdRef.value
    if (!targetId) return { draft: null, active: null }
    const response = await ensureServiceOrdersList(targetId)
    const orders = response?.data ?? []
    return {
      active: orders.find((so) => so.status === SO_STATUS.ACTIVE) ?? null,
      draft: orders.find((so) => so.status === SO_STATUS.DRAFT) ?? null
    }
  }

  const createServiceOrder = (payload) =>
    runSubmission(() => serviceOrdersService.createServiceOrder(payload))

  const updateServiceOrder = (id, payload) =>
    runSubmission(() => serviceOrdersService.updateServiceOrder(id, payload))

  const upgrade = async ({ id, accountId, newPlanId, priceId }) => {
    const targetAccountId = accountId ?? accountIdRef.value
    const serviceOrderId = id || getCurrentServiceOrder(targetAccountId)?.serviceOrderId
    if (!serviceOrderId) {
      throw new Error(SO_MESSAGES.MISSING_SERVICE_ORDER_ID)
    }

    return runSubmission(async () => {
      const response = await serviceOrdersService.upgradeServiceOrder({
        id: serviceOrderId,
        payload: { newPlanId, priceId }
      })

      if (targetAccountId) {
        try {
          await ensureServiceOrdersList(targetAccountId)
          const draft = getDraftServiceOrder(targetAccountId)
          if (draft && !response?.payment?.clientSecret && draft.priceId) {
            response.serviceOrder = draft
          }
        } catch (err) {
          Sentry.captureException(err)
        }
      }

      return response
    })
  }

  const downgrade = async ({ id, accountId, newPlanId, priceId }) => {
    const targetAccountId = accountId ?? accountIdRef.value
    const serviceOrderId = id || getCurrentServiceOrder(targetAccountId)?.serviceOrderId
    if (!serviceOrderId) {
      throw new Error(SO_MESSAGES.MISSING_SERVICE_ORDER_ID)
    }

    return runSubmission(() =>
      serviceOrdersService.downgradeServiceOrder({
        id: serviceOrderId,
        payload: { newPlanId, priceId }
      })
    )
  }

  const cancelDowngrade = async ({ id, accountId } = {}) => {
    const targetAccountId = accountId ?? accountIdRef.value
    const serviceOrderId = id || getCurrentServiceOrder(targetAccountId)?.serviceOrderId
    if (!serviceOrderId) {
      throw new Error(SO_MESSAGES.MISSING_SERVICE_ORDER_ID)
    }

    return runSubmission(() => serviceOrdersService.cancelDowngradeServiceOrder(serviceOrderId))
  }

  const submitServiceOrder = async ({ accountId, planId, planPricingId }) => {
    const targetAccountId = accountId ?? accountIdRef.value
    const currentSO = getCurrentServiceOrder(targetAccountId)
    const { action } = resolveSubmitStrategy({
      currentSO,
      planId,
      planPricingId
    })

    switch (action) {
      case SUBMIT_ACTIONS.PATCH:
        return updateServiceOrder(currentSO.serviceOrderId, {
          planId,
          planPricingId
        })

      case SUBMIT_ACTIONS.UPGRADE:
        return upgrade({
          id: currentSO.serviceOrderId,
          accountId: targetAccountId,
          newPlanId: planId,
          priceId: planPricingId
        })

      case SUBMIT_ACTIONS.CREATE:
        return createServiceOrder({ planId, planPricingId })

      case SUBMIT_ACTIONS.NOOP:
      default:
        return { success: true, data: currentSO, payment: undefined }
    }
  }

  const getServiceOrder = async (id) => {
    if (!id) return null
    const response = await serviceOrdersService.getServiceOrder(id)
    return response?.data ?? null
  }

  return {
    serviceOrder: currentServiceOrder,
    activeServiceOrder,
    draftServiceOrder,
    isLoading,
    isSubmitting,
    refetch,

    loadAccountServiceOrders,
    getServiceOrder,
    createServiceOrder,
    updateServiceOrder,
    submitServiceOrder,
    upgrade,
    downgrade,
    cancelDowngrade
  }
}
