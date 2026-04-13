import { ref, computed } from 'vue'
// eslint-disable-next-line azion-architecture/require-vue-query
import { serviceOrdersService } from '@/services/v2/service-orders/service-orders-service'

// Shared state (singleton-style)
const serviceOrder = ref(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const error = ref(null)

// Computed (derived from shared state)
const hasServiceOrder = computed(() => serviceOrder.value !== null)

/**
 * Composable for managing service orders in signup/plan subscription flow.
 * Handles fetching, creating, and updating service orders without caching.
 *
 * @returns {Object} Service orders state and methods
 */
export function useServiceOrders() {
  /**
   * Load service orders for a specific account
   * @param {string} accountId - Account ID to load
   * @returns {Promise<void>}
   */
  const loadServiceOrder = async (accountId) => {
    if (!accountId) {
      serviceOrder.value = null
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await serviceOrdersService.listServiceOrders({ accountId })

      if (response?.data?.length > 0) {
        serviceOrder.value = response.data[0]
      } else {
        serviceOrder.value = null
      }
    } catch (err) {
      error.value = err
      serviceOrder.value = null
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new service order
   * @param {Object} payload - Creation payload
   * @param {string} payload.accountId - Account ID
   * @param {string} payload.planId - Plan UUID
   * @param {string} payload.planPricingId - Plan Pricing ID
   * @returns {Promise<Object>} Created service order
   */
  const createServiceOrder = async (payload) => {
    isSubmitting.value = true
    error.value = null

    try {
      const response = await serviceOrdersService.createServiceOrder(payload)

      if (response?.data) {
        serviceOrder.value = response.data
      }

      return response
    } catch (err) {
      error.value = err
      throw err
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * Update an existing service order
   * @param {string} id - Service order ID
   * @param {Object} payload - Update payload
   * @param {string} [payload.planPricingId] - Plan Pricing ID (optional)
   * @returns {Promise<Object>} Updated service order
   */
  const updateServiceOrder = async (id, payload) => {
    isSubmitting.value = true
    error.value = null

    try {
      const response = await serviceOrdersService.updateServiceOrder(id, payload)

      if (response?.data) {
        serviceOrder.value = response.data
      }

      return response
    } catch (err) {
      error.value = err
      throw err
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * Submit service order - creates or updates based on existence
   * @param {Object} params - Submission parameters
   * @param {string} params.accountId - Account ID
   * @param {string} params.planId - Plan UUID
   * @param {string} params.planPricingId - Plan Pricing ID
   * @returns {Promise<Object>} Service order response
   */
  const submitServiceOrder = async (params) => {
    const { accountId, planId, planPricingId } = params

    if (serviceOrder.value) {
      return updateServiceOrder(serviceOrder.value.serviceOrderId, {
        accountId,
        planId,
        planPricingId
      })
    }

    return createServiceOrder({ accountId, planId, planPricingId })
  }

  /**
   * Update only planPricingId of existing service order
   * @param {string} planPricingId - New plan pricing ID
   * @returns {Promise<Object|undefined>} Updated service order or undefined if no service order exists
   */
  const updatePlanPricing = async (planPricingId) => {
    if (!serviceOrder.value?.serviceOrderId) {
      return
    }

    isSubmitting.value = true
    try {
      const response = await serviceOrdersService.updateServiceOrder(
        serviceOrder.value.serviceOrderId,
        { planPricingId }
      )
      if (response?.data) {
        serviceOrder.value = response.data
      }
      return response
    } catch {
      // Fail silently
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * Reset all state
   */
  const reset = () => {
    serviceOrder.value = null
    isLoading.value = false
    isSubmitting.value = false
    error.value = null
  }

  return {
    // State
    serviceOrder,
    hasServiceOrder,
    isLoading,
    isSubmitting,
    error,

    // Actions
    loadServiceOrder,
    createServiceOrder,
    updateServiceOrder,
    submitServiceOrder,
    updatePlanPricing,
    reset
  }
}
