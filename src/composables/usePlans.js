import { computed, onScopeDispose, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const STORAGE_KEY = 'signup_plan_params'
const DEFAULT_EXPIRATION_DAYS = 15

const VALID_PLANS = ['hobby', 'pro']
const VALID_BILLING_CYCLES = ['monthly', 'yearly']

const isValidPlan = (value) => VALID_PLANS.includes(value)
const isValidBillingCycle = (value) => VALID_BILLING_CYCLES.includes(value)

const getExpirationTimestamp = (days = DEFAULT_EXPIRATION_DAYS) =>
  Date.now() + days * 24 * 60 * 60 * 1000

const isExpired = (data) => !data?.expiresAt || Date.now() > data.expiresAt

// Signup-scoped state. The user is in a single onboarding flow at a time, so
// sharing the plan/cycle choice across the components in that flow is
// intentional. Component-level router context is resolved per-call below.
const _plan = ref(null)
const _billingCycle = ref(null)

const clearStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* storage unavailable */
  }
}

const saveToStorage = () => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        plan: _plan.value,
        billingCycle: _billingCycle.value,
        expiresAt: getExpirationTimestamp()
      })
    )
  } catch {
    /* storage unavailable */
  }
}

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (isExpired(data)) {
      clearStorage()
      return null
    }
    return {
      plan: data.plan && isValidPlan(data.plan) ? data.plan : null,
      billingCycle: data.billingCycle || null
    }
  } catch {
    clearStorage()
    return null
  }
}

export function usePlans() {
  const route = useRoute()
  const router = useRouter()

  const readFromUrl = () => {
    if (!route) return null
    const { query } = route
    const params = {}

    if (query.plan && isValidPlan(query.plan)) params.plan = query.plan

    const rawCycle = query['billing-cycle'] ?? query.billingCycle
    const cycle = Array.isArray(rawCycle) ? rawCycle[0] : rawCycle
    if (typeof cycle === 'string' && isValidBillingCycle(cycle)) {
      params.billingCycle = cycle
    }

    return Object.keys(params).length ? params : null
  }

  const syncToUrl = async () => {
    if (!route || !router) return

    const currentQuery = { ...route.query }
    const nextQuery = { ...currentQuery }

    if (_plan.value) nextQuery.plan = _plan.value
    else delete nextQuery.plan

    if (_billingCycle.value) {
      nextQuery['billing-cycle'] = _billingCycle.value
      delete nextQuery.billingCycle
    } else {
      delete nextQuery['billing-cycle']
      delete nextQuery.billingCycle
    }

    if (JSON.stringify(currentQuery) === JSON.stringify(nextQuery)) return
    await router.replace({ path: route.path, query: nextQuery })
  }

  const initialize = () => {
    const urlParams = readFromUrl()
    if (urlParams) {
      _plan.value = urlParams.plan || null
      _billingCycle.value = urlParams.billingCycle || null
      saveToStorage()
      return
    }

    const stored = loadFromStorage()
    if (stored?.plan) {
      _plan.value = stored.plan
      _billingCycle.value = stored.billingCycle
      return
    }

    _plan.value = 'pro'
    _billingCycle.value = 'monthly'
    saveToStorage()
  }

  const setParam = (key, value) => {
    if (key === 'plan' && (value === null || isValidPlan(value))) _plan.value = value
    else if (key === 'billingCycle' && (value === null || isValidBillingCycle(value)))
      _billingCycle.value = value
    saveToStorage()
  }

  const setParams = (params) => {
    if (params.plan !== undefined && (params.plan === null || isValidPlan(params.plan))) {
      _plan.value = params.plan
    }
    if (
      params.billingCycle !== undefined &&
      (params.billingCycle === null || isValidBillingCycle(params.billingCycle))
    ) {
      _billingCycle.value = params.billingCycle
    }
    saveToStorage()
  }

  const clear = async () => {
    _plan.value = null
    _billingCycle.value = null
    clearStorage()
    await syncToUrl()
  }

  // Bind URL sync to the calling component's lifecycle so multiple instances
  // don't share a single stale router reference.
  const stopWatch = watch([_plan, _billingCycle], () => {
    syncToUrl()
  })
  onScopeDispose(stopWatch)

  return {
    plan: computed(() => _plan.value),
    billingCycle: computed(() => _billingCycle.value),
    params: computed(() => ({ plan: _plan.value, billingCycle: _billingCycle.value })),
    hasParams: computed(() => _plan.value !== null || _billingCycle.value !== null),

    isValidPlan,
    isValidBillingCycle,
    VALID_PLANS,
    VALID_BILLING_CYCLES,

    initialize,
    setParam,
    setParams,
    clear,

    syncToUrl,
    saveToStorage,
    loadFromStorage
  }
}
