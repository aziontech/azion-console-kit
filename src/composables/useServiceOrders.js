import { ref, computed } from 'vue'
// eslint-disable-next-line azion-architecture/require-vue-query
import { serviceOrdersService } from '@/services/v2/service-orders/service-orders-service'

/**
 * Composable for managing service orders in signup/plan subscription flow.
 * Handles fetching, creating, and updating service orders without caching.
 *
 * @returns {Object} Service orders state and methods
 */
export function useServiceOrders() {
  // State
  const serviceOrder = ref(null)
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const error = ref(null)

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
   * @returns {Promise<Object>} Service order response
   */
  const submitServiceOrder = async (params) => {
    const { accountId, planId } = params

    if (serviceOrder.value) {
      return updateServiceOrder(serviceOrder.value.serviceOrderId, { accountId, planId })
    }

    return createServiceOrder({ accountId, planId })
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

  // Computed
  const hasServiceOrder = computed(() => serviceOrder.value !== null)

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
    reset
  }
}
