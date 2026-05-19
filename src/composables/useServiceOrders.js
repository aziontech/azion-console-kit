import { ref } from 'vue'
import { serviceOrdersService } from '@/services/v2/service-orders/service-orders-service'
import { SO_MESSAGES, SO_STATUS } from '@/services/v2/service-orders/service-orders-constants'
import {
  SUBMIT_ACTIONS,
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

const listDrafts = (accountId) =>
  serviceOrdersService.listServiceOrders({ accountId, status: SO_STATUS.DRAFT })

export function useServiceOrders() {
  const loadAccountServiceOrders = async (accountId) => {
    if (!accountId) {
      serviceOrder.value = null
      return { draft: null, active: null }
    }

    isLoading.value = true

    try {
      const response = await serviceOrdersService.listServiceOrders({ accountId })
      const orders = response?.data ?? []
      const active = orders.find((so) => so.status === SO_STATUS.ACTIVE) ?? null
      const draft = orders.find((so) => so.status === SO_STATUS.DRAFT) ?? null

      if (active) serviceOrder.value = active
      if (draft) serviceOrder.value = draft
      if (!active && !draft) serviceOrder.value = null

      return { draft, active }
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

      if (accountId) {
        try {
          const listResp = await listDrafts(accountId)
          const draft = listResp?.data?.[0] ?? null
          if (draft) {
            serviceOrder.value = draft
            if (!response?.payment?.clientSecret && draft.priceId) {
              response.serviceOrder = draft
            }
          }
        } catch {
          /* */
        }
      }

      return response
    })
  }

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
    const response = await serviceOrdersService.getServiceOrder(id)
    const so = response?.data ?? null
    if (so) serviceOrder.value = so
    return so
  }

  return {
    serviceOrder,
    isLoading,
    isSubmitting,

    loadAccountServiceOrders,
    getServiceOrder,
    createServiceOrder,
    updateServiceOrder,
    submitServiceOrder,
    upgrade,
    downgrade
  }
}
