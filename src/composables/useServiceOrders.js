import { computed } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { serviceOrdersService } from '@/services/v2/service-orders/service-orders-service'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { useAccountStore } from '@/stores/account'
import { SO_MESSAGES, SO_STATUS } from '@/services/v2/service-orders/service-orders-constants'
import {
  SUBMIT_ACTIONS,
  resolveSubmitStrategy
} from '@/services/v2/service-orders/service-orders-strategy'
import {
  useServiceOrdersList,
  ensureServiceOrdersList,
  getCurrentServiceOrder
} from '@/composables/useServiceOrdersList'
import { invalidateCurrentAccountSubscription } from '@/composables/useCurrentAccountSubscriptionService'

const invalidateAllServiceOrderCaches = () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.serviceOrders.all })
  invalidateCurrentAccountSubscription()
}

export function useServiceOrders() {
  const accountStore = useAccountStore()
  const accountIdRef = computed(() => accountStore.accountData?.id ?? null)

  const { activeServiceOrder, draftServiceOrder, currentServiceOrder, isLoading, refetch } =
    useServiceOrdersList(accountIdRef)

  const mutationOptions = { onSuccess: invalidateAllServiceOrderCaches }

  const createMutation = useMutation({
    mutationFn: (payload) => serviceOrdersService.createServiceOrder(payload),
    ...mutationOptions
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => serviceOrdersService.updateServiceOrder(id, payload),
    ...mutationOptions
  })

  const upgradeMutation = useMutation({
    mutationFn: (variables) => serviceOrdersService.upgradeServiceOrder(variables),
    ...mutationOptions
  })

  const downgradeMutation = useMutation({
    mutationFn: (variables) => serviceOrdersService.downgradeServiceOrder(variables),
    ...mutationOptions
  })

  const cancelDowngradeMutation = useMutation({
    mutationFn: (id) => serviceOrdersService.cancelDowngradeServiceOrder(id),
    ...mutationOptions
  })

  const isSubmitting = computed(
    () =>
      createMutation.isPending.value ||
      updateMutation.isPending.value ||
      upgradeMutation.isPending.value ||
      downgradeMutation.isPending.value ||
      cancelDowngradeMutation.isPending.value
  )

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

  const createServiceOrder = (payload) => createMutation.mutateAsync(payload)

  const updateServiceOrder = (id, payload) => updateMutation.mutateAsync({ id, payload })

  const resolveServiceOrderId = (id, accountId) => {
    if (id) return id
    const targetAccountId = accountId ?? accountIdRef.value
    return getCurrentServiceOrder(targetAccountId)?.serviceOrderId ?? null
  }

  const upgrade = async ({ id, accountId, newPlanId, priceId }) => {
    const serviceOrderId = resolveServiceOrderId(id, accountId)
    if (!serviceOrderId) throw new Error(SO_MESSAGES.MISSING_SERVICE_ORDER_ID)
    return upgradeMutation.mutateAsync({
      id: serviceOrderId,
      payload: { newPlanId, priceId }
    })
  }

  const downgrade = async ({ id, accountId, newPlanId, priceId }) => {
    const serviceOrderId = resolveServiceOrderId(id, accountId)
    if (!serviceOrderId) throw new Error(SO_MESSAGES.MISSING_SERVICE_ORDER_ID)
    return downgradeMutation.mutateAsync({
      id: serviceOrderId,
      payload: { newPlanId, priceId }
    })
  }

  const cancelDowngrade = async ({ id, accountId } = {}) => {
    const serviceOrderId = resolveServiceOrderId(id, accountId)
    if (!serviceOrderId) throw new Error(SO_MESSAGES.MISSING_SERVICE_ORDER_ID)
    return cancelDowngradeMutation.mutateAsync(serviceOrderId)
  }

  const submitServiceOrder = async ({ accountId, planId, planPricingId }) => {
    const targetAccountId = accountId ?? accountIdRef.value
    const currentSO = getCurrentServiceOrder(targetAccountId)
    const { action } = resolveSubmitStrategy({ currentSO, planId, planPricingId })

    switch (action) {
      case SUBMIT_ACTIONS.PATCH:
        return updateServiceOrder(currentSO.serviceOrderId, { planId, planPricingId })

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
        return { success: true, data: currentSO, payment: null }
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
