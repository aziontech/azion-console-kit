import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const STORAGE_KEY = 'signup_plan_params'
const DEFAULT_EXPIRATION_DAYS = 15

const VALID_PLANS = ['hobby', 'pro']
const VALID_BILLING_CYCLES = ['monthly', 'yearly']

// Shared state (singleton-style)
const _plan = ref(null)
const _billingCycle = ref(null)
const _cupom = ref(null)

// Active router context (refreshed on each usePlans call)
const activeRoute = ref(null)
const activeRouter = ref(null)

// Ensure sync watcher is registered only once
let hasSyncWatcher = false

/**
 * @typedef {Object} PlanParams
 * @property {string|null} plan - The selected plan (hobby, pro)
 * @property {string|null} billingCycle - The billing cycle (monthly, yearly)
 * @property {string|null} cupom - The coupon code
 */

/**
 * Composable for managing signup plan parameters with localStorage persistence
 * and automatic URL synchronization.
 *
 * @returns {Object} Plan params state and methods
 */
export function usePlans() {
  const route = useRoute()
  const router = useRouter()

  activeRoute.value = route
  activeRouter.value = router

  /**
   * Validates if a plan value is valid
   * @param {string} value
   * @returns {boolean}
   */
  const isValidPlan = (value) => VALID_PLANS.includes(value)

  /**
   * Validates if a billing cycle value is valid
   * @param {string} value
   * @returns {boolean}
   */
  const isValidBillingCycle = (value) => VALID_BILLING_CYCLES.includes(value)

  /**
   * Get current timestamp
   * @returns {number}
   */
  const getCurrentTimestamp = () => Date.now()

  /**
   * Calculate expiration timestamp
   * @param {number} days
   * @returns {number}
   */
  const getExpirationTimestamp = (days = DEFAULT_EXPIRATION_DAYS) => {
    return getCurrentTimestamp() + days * 24 * 60 * 60 * 1000
  }

  /**
   * Check if stored data is expired
   * @param {Object} data
   * @returns {boolean}
   */
  const isExpired = (data) => {
    if (!data?.expiresAt) return true
    return getCurrentTimestamp() > data.expiresAt
  }

  /**
   * Save params to localStorage
   */
  const saveToStorage = () => {
    const data = {
      plan: _plan.value,
      billingCycle: _billingCycle.value,
      cupom: _cupom.value,
      expiresAt: getExpirationTimestamp()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  /**
   * Load params from localStorage
   * @returns {PlanParams|null}
   */
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return null

      const data = JSON.parse(stored)
      if (isExpired(data)) {
        clearStorage()
        return null
      }

      return {
        plan: data.plan && isValidPlan(data.plan) ? data.plan : null,
        billingCycle: data.billingCycle || null,
        cupom: data.cupom || null
      }
    } catch {
      clearStorage()
      return null
    }
  }

  /**
   * Clear localStorage data
   */
  const clearStorage = () => {
    localStorage.removeItem(STORAGE_KEY)
  }

  /**
   * Read params from URL query string
   * URL has priority over localStorage
   * @returns {PlanParams|null}
   */
  const readFromUrl = () => {
    const currentRoute = activeRoute.value
    if (!currentRoute) return null

    const query = currentRoute.query
    const urlParams = {}

    if (query.plan && isValidPlan(query.plan)) {
      urlParams.plan = query.plan
    }

    const billingCycleQuery = query['billing-cycle'] ?? query.billingCycle
    const normalizedBillingCycle = Array.isArray(billingCycleQuery)
      ? billingCycleQuery[0]
      : billingCycleQuery

    if (typeof normalizedBillingCycle === 'string' && isValidBillingCycle(normalizedBillingCycle)) {
      urlParams.billingCycle = normalizedBillingCycle
    }

    if (query.cupom && typeof query.cupom === 'string') {
      urlParams.cupom = query.cupom
    }

    return Object.keys(urlParams).length > 0 ? urlParams : null
  }

  /**
   * Sync params to URL query string
   */
  const syncToUrl = async () => {
    const currentRoute = activeRoute.value
    const currentRouter = activeRouter.value

    if (!currentRoute || !currentRouter) return

    const currentQuery = { ...currentRoute.query }
    const newQuery = { ...currentQuery }

    // Update or remove plan
    if (_plan.value) {
      newQuery.plan = _plan.value
    } else if (currentQuery.plan) {
      delete newQuery.plan
    }

    // Update or remove billingCycle (canonical URL param: billing-cycle)
    if (_billingCycle.value) {
      newQuery['billing-cycle'] = _billingCycle.value
      if (currentQuery.billingCycle) {
        delete newQuery.billingCycle
      }
    } else {
      if (currentQuery['billing-cycle']) {
        delete newQuery['billing-cycle']
      }
      if (currentQuery.billingCycle) {
        delete newQuery.billingCycle
      }
    }

    // Update or remove cupom
    if (_cupom.value) {
      newQuery.cupom = _cupom.value
    } else if (currentQuery.cupom) {
      delete newQuery.cupom
    }

    // Only navigate if query actually changed
    const queryChanged = JSON.stringify(currentQuery) !== JSON.stringify(newQuery)

    if (queryChanged) {
      await currentRouter.replace({
        path: currentRoute.path,
        query: newQuery
      })
    }
  }

  /**
   * Initialize params from URL (priority) or localStorage
   * Should be called once when entering signup flow
   */
  const initialize = () => {
    // URL has priority
    const urlParams = readFromUrl()
    if (urlParams) {
      _plan.value = urlParams.plan || null
      _billingCycle.value = urlParams.billingCycle || null
      _cupom.value = urlParams.cupom || null
      saveToStorage()
      return
    }

    // Fall back to localStorage
    const storedParams = loadFromStorage()
    if (storedParams) {
      _plan.value = storedParams.plan
      _billingCycle.value = storedParams.billingCycle
      _cupom.value = storedParams.cupom
    }
  }

  /**
   * Set a single parameter
   * @param {string} key - Parameter name (plan, billingCycle, cupom)
   * @param {string|null} value - Parameter value
   */
  const setParam = (key, value) => {
    switch (key) {
      case 'plan':
        if (value === null || isValidPlan(value)) {
          _plan.value = value
        }
        break
      case 'billingCycle':
        if (value === null || isValidBillingCycle(value)) {
          _billingCycle.value = value
        }
        break
      case 'cupom':
        _cupom.value = value
        break
    }
    saveToStorage()
  }

  /**
   * Set all params at once
   * @param {PlanParams} params
   */
  const setParams = (params) => {
    if (params.plan !== undefined) {
      if (params.plan === null || isValidPlan(params.plan)) {
        _plan.value = params.plan
      }
    }
    if (params.billingCycle !== undefined) {
      if (params.billingCycle === null || isValidBillingCycle(params.billingCycle)) {
        _billingCycle.value = params.billingCycle
      }
    }
    if (params.cupom !== undefined) {
      _cupom.value = params.cupom
    }
    saveToStorage()
  }

  /**
   * Clear all params from memory, storage and URL
   */
  const clear = async () => {
    _plan.value = null
    _billingCycle.value = null
    _cupom.value = null
    clearStorage()
    await syncToUrl()
  }

  /**
   * Check if any params are set
   * @returns {boolean}
   */
  const hasParams = computed(() => {
    return _plan.value !== null || _billingCycle.value !== null || _cupom.value !== null
  })

  /**
   * Get all params as object
   * @returns {PlanParams}
   */
  const params = computed(() => ({
    plan: _plan.value,
    billingCycle: _billingCycle.value,
    cupom: _cupom.value
  }))

  // Watch for changes and sync to URL automatically
  if (!hasSyncWatcher) {
    watch(
      [_plan, _billingCycle, _cupom],
      () => {
        syncToUrl()
      },
      { deep: true }
    )

    hasSyncWatcher = true
  }

  return {
    // State (reactive)
    plan: computed(() => _plan.value),
    billingCycle: computed(() => _billingCycle.value),
    cupom: computed(() => _cupom.value),
    params,
    hasParams,

    // Validation helpers
    isValidPlan,
    isValidBillingCycle,
    VALID_PLANS,
    VALID_BILLING_CYCLES,

    // Actions
    initialize,
    setParam,
    setParams,
    clear,

    // Low-level utilities
    syncToUrl,
    saveToStorage,
    loadFromStorage
  }
}
