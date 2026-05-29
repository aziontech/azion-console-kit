import { computed, effectScope, onScopeDispose, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/account'
import {
  readScoped,
  writeScoped,
  removeScoped,
  migrateGuestTo
} from '@/helpers/client-scoped-storage'
import { onSwitchAccount } from '@/services/v2/base/auth/session-broadcast'

const BASE_KEY = 'plans:v1'
const VALID_PLANS = ['hobby', 'pro']
const VALID_BILLING_CYCLES = ['monthly', 'yearly']

const isValidPlan = (value) => VALID_PLANS.includes(value)
const isValidBillingCycle = (value) => VALID_BILLING_CYCLES.includes(value)

const isStorageAvailable = () => typeof window !== 'undefined' && Boolean(window.localStorage)

// Signup-scoped state. The user is in a single onboarding flow at a time, so
// sharing the plan/cycle choice across the components in that flow is
// intentional. Module-level refs survive in-session navigation; localStorage
// scoped by client_id is the source of truth across reloads, deep links, and
// account switches (storage wins over URL).
const _plan = ref(null)
const _billingCycle = ref(null)

const persistScope = () => {
  if (!isStorageAvailable()) return
  const value = { plan: _plan.value, billingCycle: _billingCycle.value }
  if (!value.plan && !value.billingCycle) {
    removeScoped(BASE_KEY)
    return
  }
  writeScoped(BASE_KEY, value)
}

const hydrateFromScope = () => {
  const stored = readScoped(BASE_KEY)
  if (stored && (stored.plan || stored.billingCycle)) {
    _plan.value = stored.plan ?? null
    _billingCycle.value = stored.billingCycle ?? null
    return true
  }
  return false
}

let _isSynced = false
const _moduleScope = effectScope(true)

const setupSync = (accountStore) => {
  if (_isSynced) return
  _isSynced = true

  _moduleScope.run(() => {
    watch([_plan, _billingCycle], persistScope)

    watch(
      () => accountStore.account?.client_id,
      (newId, oldId) => {
        if (newId && !oldId) {
          migrateGuestTo(BASE_KEY, newId)
          hydrateFromScope()
        } else if (newId && oldId && newId !== oldId) {
          _plan.value = null
          _billingCycle.value = null
          if (!hydrateFromScope()) {
            _plan.value = 'pro'
            _billingCycle.value = 'monthly'
          }
        } else if (!newId && oldId) {
          _plan.value = null
          _billingCycle.value = null
        }
      }
    )
  })

  onSwitchAccount(() => {
    _plan.value = null
    _billingCycle.value = null
    if (!hydrateFromScope()) {
      _plan.value = 'pro'
      _billingCycle.value = 'monthly'
    }
  })
}

export function usePlans() {
  const route = useRoute()
  const router = useRouter()
  const accountStore = useAccountStore()

  setupSync(accountStore)

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
    if (hydrateFromScope()) {
      syncToUrl()
      return
    }

    const urlParams = readFromUrl()
    if (urlParams) {
      _plan.value = urlParams.plan || null
      _billingCycle.value = urlParams.billingCycle || null
      return
    }

    if (_plan.value || _billingCycle.value) return

    _plan.value = 'pro'
    _billingCycle.value = 'monthly'
  }

  const setParam = (key, value) => {
    if (key === 'plan' && (value === null || isValidPlan(value))) _plan.value = value
    else if (key === 'billingCycle' && (value === null || isValidBillingCycle(value)))
      _billingCycle.value = value
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
  }

  const clear = async () => {
    _plan.value = null
    _billingCycle.value = null
    removeScoped(BASE_KEY)
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

    syncToUrl
  }
}
