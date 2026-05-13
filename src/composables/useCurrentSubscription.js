import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAccountStore } from '@/stores/account'
import { useServiceOrders } from '@/composables/useServiceOrders'
import { usePlansList } from '@/composables/usePlansService'
import { loadUserAndAccountInfo } from '@/helpers/account-data'
import { formatDateToUSBilling } from '@/helpers/convert-date'

// Module-level flag so the billing UI keeps the skeleton on while we poll the
// backend after a payment. Shared singleton because every BillsView mount
// instantiates useCurrentSubscription fresh.
const isRefreshing = ref(false)

// Singleton in-flight promise for the ACTIVE SO load. Multiple watchers (one
// per useCurrentSubscription instance) used to fire concurrent
// `/service_orders?status=ACTIVE` requests on mount; this dedupe ensures only
// one request is in flight at any time and every caller awaits the same
// promise.
let activeLoadPromise = null

/**
 * Resolves the current plan for the billing UI.
 *
 * Source of truth: the ACTIVE service order. We read its `planId` and match
 * it against the plans catalog (Hobby vs Pro). No ACTIVE SO → 'hobby'.
 *
 * `/info.has_service_order_plan` is intentionally **NOT** consulted for the
 * plan SKU. The flag is an onboarding gate ("did this account finish plan
 * selection?") and can be inconsistent with the actual SO state — e.g. it
 * can stay `true` after the ACTIVE SO is canceled, which previously made
 * the badge claim "Pro Plan" off of a stale DRAFT. The flag is only used
 * as an optimization to skip the SO fetch while the account is still in
 * the signup flow (no plan to fetch yet).
 *
 * Both fetches are cached (Vue Query for plans, shared state for the SO),
 * so re-mounting the billing view doesn't re-issue requests.
 *
 * @returns {Object} Current-plan flags + display fields used by the billing UI
 */
export function useCurrentSubscription() {
  const accountStore = useAccountStore()
  const { accountData } = storeToRefs(accountStore)

  // `has_service_order_plan` is an onboarding gate, not a plan identifier.
  // `false` means the account hasn't selected a plan yet (signup path);
  // anything else means onboarding is done — but says nothing about whether
  // it landed on Hobby or Pro. Use this only to decide whether to fetch
  // the SO at all; the SKU decision lives entirely in `planSku`.
  const hasFinishedOnboarding = computed(() => accountData.value?.has_service_order_plan !== false)
  // Preserved name for backwards compatibility with consumers (BillsView etc.)
  // that still read `subscription.hasContractedPlan`. Same boolean — the new
  // name above documents intent inside this composable.
  const hasContractedPlan = hasFinishedOnboarding

  const { serviceOrder, isLoading: isLoadingServiceOrder, loadServiceOrder } = useServiceOrders()
  const { data: plansData, isLoading: isLoadingPlans } = usePlansList()

  // Opportunistically load the ACTIVE SO so the SKU can be resolved. Skipped
  // when the account has no contracted plan (nothing to fetch) and when the
  // shared SO state is already populated by another view (e.g. BillsView
  // change-plan flow). Coalesces concurrent calls into a single request via
  // the module-level `activeLoadPromise` (avoids hammering the endpoint when
  // both the SubscriptionPlanCard and CurrentInvoiceCard mount at the same
  // time).
  const loadActiveOnce = (accountId) => {
    if (activeLoadPromise) return activeLoadPromise
    activeLoadPromise = loadServiceOrder(accountId, {
      preferStatus: 'ACTIVE',
      noFallback: true
    })
      .catch(() => {})
      .finally(() => {
        activeLoadPromise = null
      })
    return activeLoadPromise
  }

  // The SO ref in useServiceOrders is a module-level singleton — a DRAFT
  // created elsewhere (e.g. the change-plan drawer) can leak in here. Only
  // an ACTIVE SO represents the current plan, so we gate every derived field
  // on this instead of reading `serviceOrder.value` directly.
  const activeServiceOrderState = computed(() =>
    serviceOrder.value?.status === 'ACTIVE' ? serviceOrder.value : null
  )

  watch(
    () => [accountData.value?.id, hasFinishedOnboarding.value],
    ([accountId, finishedOnboarding]) => {
      if (!accountId || !finishedOnboarding) return
      if (activeServiceOrderState.value || isLoadingServiceOrder.value) return
      loadActiveOnce(accountId)
    },
    { immediate: true }
  )

  const planSku = computed(() => {
    // Hold null while the ACTIVE SO request is in flight so the skeleton
    // stays up. Once it settles, the SO alone decides — no fallback to
    // the onboarding flag.
    if (isLoadingServiceOrder.value) return null
    const so = activeServiceOrderState.value
    if (!so) return 'hobby'
    const planId = so.planId
    if (!planId || !Array.isArray(plansData.value)) return null
    const plan = plansData.value.find((item) => item.id === planId)
    return plan?.sku?.toLowerCase() ?? null
  })

  // Cycle of the active SO ('monthly' | 'yearly' | null). Resolved by matching
  // the SO's priceId against any plan's pricings — Hobby SOs (free) have no
  // priceId, so this stays null for them.
  const activePricing = computed(() => {
    const priceId = activeServiceOrderState.value?.priceId
    if (!priceId || !Array.isArray(plansData.value)) return null
    for (const plan of plansData.value) {
      const pricing = plan.pricings?.find((item) => item.id === priceId)
      if (pricing) return pricing
    }
    return null
  })

  const billingCycle = computed(() => activePricing.value?.periodicity ?? null)

  // Numeric price of the current plan charge (sourced from the SO's pricing).
  // Hobby plans have no priceId → 0. Used by CurrentInvoiceCard to render
  // "Plan Charge" and to derive the invoice Total alongside service charges.
  const planChargeValue = computed(() => {
    if (!hasContractedPlan.value) return 0
    const value = Number(activePricing.value?.priceValue ?? 0)
    return Number.isFinite(value) ? value : 0
  })

  const currencyCode = computed(() => activePricing.value?.currencyCode ?? null)

  const isPro = computed(() => planSku.value === 'pro')
  const isHobby = computed(() => planSku.value === 'hobby')

  const planTitle = computed(() => (isPro.value ? 'Pro Plan' : 'Hobby'))
  const planTag = computed(() => (isHobby.value ? 'Free Plan' : null))

  // Sourced from the ACTIVE SO's `currentPeriodStart`. The field can arrive
  // as either a plain YYYY-MM-DD string or a full ISO timestamp, so we slice
  // to the date portion before handing it to the billing formatter (which is
  // strict about the YYYY-MM-DD shape).
  const planStartDate = computed(() => {
    const raw = activeServiceOrderState.value?.currentPeriodStart
    if (!raw) return null
    const dateOnly = String(raw).slice(0, 10)
    const formatted = formatDateToUSBilling(dateOnly)
    return formatted === '---' ? null : formatted
  })
  const nextChargeDate = computed(() => null)
  const nextChargeValue = computed(() => planChargeValue.value)

  // Backwards-compat stubs: previously these exposed the SO list. Callers
  // that still read them get a harmless null/false.
  const activeServiceOrder = computed(() => null)
  const draftServiceOrder = computed(() => null)
  const isDraft = computed(() => false)

  const isLoading = computed(() => {
    if (isRefreshing.value) return true
    if (!accountData.value?.id) return true
    if (!hasContractedPlan.value) return false
    return isLoadingServiceOrder.value || isLoadingPlans.value || planSku.value === null
  })

  /**
   * Refresh the source of truth (`/info` + ACTIVE SO). Call after a
   * successful subscription / plan change so the card flips to the new plan.
   * Bypasses the Vue Query cache (`force: true`) — `has_service_order_plan`
   * changes immediately on the backend after a transition, so the cached
   * value would mislead the billing UI into thinking the plan is still old.
   * The ACTIVE SO load is uncached by design, so it always hits the network.
   */
  const refetch = async () => {
    await loadUserAndAccountInfo({ force: true })
    const accountId = accountData.value?.id
    if (accountId && hasContractedPlan.value) {
      await loadServiceOrder(accountId, { preferStatus: 'ACTIVE', noFallback: true })
    }
  }

  /**
   * Refetch until `predicate({ planSku, billingCycle })` returns true. Used
   * after payment — the Stripe webhook transitions the new DRAFT to ACTIVE
   * asynchronously, so an immediate refetch often still returns the old
   * plan. Keeps `isLoading` true throughout so the cards stay in skeleton
   * state until the new plan lands (or attempts run out).
   *
   * @param {(ctx: { planSku: string|null, billingCycle: string|null }) => boolean} predicate
   * @param {Object} [options]
   * @param {number} [options.attempts=8]
   * @param {number} [options.delayMs=1500]
   * @returns {Promise<boolean>}
   */
  const refetchUntil = async (predicate, options = {}) => {
    const { attempts = 8, delayMs = 1500 } = options
    isRefreshing.value = true
    try {
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        // eslint-disable-next-line no-await-in-loop
        await refetch()
        if (predicate({ planSku: planSku.value, billingCycle: billingCycle.value })) {
          return true
        }
        if (attempt < attempts - 1) {
          // eslint-disable-next-line no-await-in-loop
          await new Promise((resolve) => setTimeout(resolve, delayMs))
        }
      }
      return false
    } finally {
      isRefreshing.value = false
    }
  }

  return {
    serviceOrder,
    activeServiceOrder,
    draftServiceOrder,
    planSku,
    billingCycle,
    activePricing,
    planChargeValue,
    planTitle,
    planTag,
    planStartDate,
    nextChargeDate,
    nextChargeValue,
    currencyCode,
    hasContractedPlan,
    isHobby,
    isPro,
    isDraft,
    isLoading,
    isRefreshing,
    refetch,
    refetchUntil
  }
}
