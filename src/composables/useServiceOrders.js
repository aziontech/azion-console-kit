import { ref, computed } from 'vue'
// eslint-disable-next-line azion-architecture/require-vue-query
import { serviceOrdersService } from '@/services/v2/service-orders/service-orders-service'

// Shared state (singleton-style)
const serviceOrder = ref(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const error = ref(null)

// Locked SO ids — backend rejected mutations because payment is being
// confirmed by the Stripe webhook. We stop hammering until the snapshot
// refresh shows a different SO or status (loadServiceOrder clears it).
const lockedServiceOrderIds = ref(new Set())

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

// Backend rule (aligned with API team): PATCH on a service order is only
// accepted before the payment is completed AND within 24h of creation. The
// DRAFT status already implies payment hasn't completed, so we just guard
// the 24h window here. SOs outside this window must take the POST path so a
// fresh DRAFT is created instead of hitting a rejection.
const isDraftPatchable = (so) => {
  if (!so || so.status !== 'DRAFT') return false
  const createdAt = so.createdAt ? Date.parse(so.createdAt) : NaN
  if (!Number.isFinite(createdAt)) return true
  return Date.now() - createdAt < TWENTY_FOUR_HOURS_MS
}

// Computed (derived from shared state)
const hasServiceOrder = computed(() => serviceOrder.value !== null)
const isPaymentPendingLocked = computed(() => {
  const id = serviceOrder.value?.serviceOrderId
  return Boolean(id && lockedServiceOrderIds.value.has(id))
})

/**
 * Composable for managing service orders in signup/plan subscription flow.
 * Handles fetching, creating, and updating service orders without caching.
 *
 * @returns {Object} Service orders state and methods
 */
export function useServiceOrders() {
  /**
   * Load the most relevant service order for an account.
   *
   * When the account has multiple SOs (e.g. Hobby ACTIVE + Pro DRAFT), the
   * preference is: DRAFT first (it's what mutations should target), then
   * ACTIVE, then anything else. Pass `{ preferStatus: 'ACTIVE' }` to invert.
   * Pass `{ noFallback: true }` when the caller knows only the preferred
   * status can possibly exist (e.g. onboarding — no ACTIVE) to skip the
   * second list call.
   *
   * @param {string|number} accountId
   * @param {Object} [options]
   * @param {'DRAFT'|'ACTIVE'} [options.preferStatus='DRAFT']
   * @param {boolean} [options.noFallback=false]
   * @returns {Promise<void>}
   */
  const loadServiceOrder = async (accountId, options = {}) => {
    if (!accountId) {
      serviceOrder.value = null
      return
    }

    const { preferStatus = 'DRAFT', noFallback = false } = options
    const fallbackStatus = preferStatus === 'DRAFT' ? 'ACTIVE' : 'DRAFT'

    isLoading.value = true
    error.value = null

    try {
      // Filter at API level: try preferred status first (e.g. DRAFT for the
      // upgrade drawer — we want to edit any pending SO instead of creating
      // a duplicate one). Fall back to the alternate status only if empty.
      const preferredResponse = await serviceOrdersService.listServiceOrders({
        accountId,
        status: preferStatus
      })
      let so = preferredResponse?.data?.[0] ?? null

      if (!so && !noFallback) {
        const fallbackResponse = await serviceOrdersService.listServiceOrders({
          accountId,
          status: fallbackStatus
        })
        so = fallbackResponse?.data?.[0] ?? null
      }

      serviceOrder.value = so

      // Refresh succeeded — clear stale payment-pending locks so mutations
      // can resume. The backend has had a chance to process webhooks since
      // the previous lock was set.
      lockedServiceOrderIds.value = new Set()
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
  const errorList = (err) => {
    if (Array.isArray(err)) return err
    if (Array.isArray(err?.errors)) return err.errors
    if (Array.isArray(err?.message)) return err.message
    return [err]
  }

  const matchesDetail = (err, regex) =>
    errorList(err).some((item) => {
      const detail = typeof item === 'string' ? item : item?.detail || item?.message || ''
      return regex.test(detail)
    })

  const isDraftOnlyConflict = (err) =>
    matchesDetail(err, /draft\s*status|can\s*only\s*be\s*edited\s*while\s*in\s*draft/i)

  const isPaymentPendingConflict = (err) =>
    matchesDetail(err, /payment\s*already\s*received|wait\s*for\s*confirmation/i)

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
      // Backend rejects: SO is locked by a pending Stripe confirmation. Mark
      // this SO id as locked so subsequent mutations short-circuit instead of
      // hammering the backend with the same 409. The lock clears when
      // loadServiceOrder fetches fresh state.
      if (isPaymentPendingConflict(err)) {
        if (id) lockedServiceOrderIds.value.add(id)
        const friendly = new Error(
          'Your previous payment is still being processed. Refresh in a moment to see the updated status.'
        )
        friendly.cause = err
        friendly.code = 'PAYMENT_PENDING'
        error.value = friendly
        throw friendly
      }

      // Backend says SO is not DRAFT after all. Only fallback to /upgrade when
      // we're actually changing plan — /upgrade rejects same-plan requests.
      if (
        isDraftOnlyConflict(err) &&
        payload?.planId &&
        payload.planId !== serviceOrder.value?.planId
      ) {
        return upgrade({
          id,
          accountId: payload.accountId,
          newPlanId: payload.planId,
          priceId: payload.priceId ?? payload.planPricingId
        })
      }
      error.value = err
      throw err
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * Submit service order — picks the right endpoint based on current SO state:
   *   - no SO                                → POST /service_orders          (signup)
   *   - DRAFT exists                         → PATCH /service_orders/:id     (edit DRAFT)
   *   - ACTIVE + plan change                 → PATCH /:id/upgrade            (upgrade/downgrade)
   *   - ACTIVE + same plan + price change    → POST /service_orders          (new DRAFT for cycle change)
   *   - ACTIVE + same plan + same price      → no-op                         (nothing to commit)
   *
   * @param {Object} params
   * @param {string|number} params.accountId
   * @param {string} params.planId
   * @param {string} [params.planPricingId]
   * @returns {Promise<Object>}
   */
  const submitServiceOrder = async (params) => {
    const { accountId, planId, planPricingId } = params

    if (!serviceOrder.value) {
      return createServiceOrder({ accountId, planId, planPricingId })
    }

    // Skip mutations on SOs flagged as locked by Stripe confirmation. The UI
    // surfaces a "wait for confirmation" message; refetching the SO list
    // (loadServiceOrder) is the way out.
    if (isPaymentPendingLocked.value) {
      const friendly = new Error(
        'Your previous payment is still being processed. Refresh in a moment to see the updated status.'
      )
      friendly.code = 'PAYMENT_PENDING'
      throw friendly
    }

    if (isDraftPatchable(serviceOrder.value)) {
      return updateServiceOrder(serviceOrder.value.serviceOrderId, {
        accountId,
        planId,
        planPricingId
      })
    }

    // DRAFT outside the 24h PATCH window — backend would reject the mutation.
    // POST a fresh SO so the user can keep going; the stale DRAFT is left for
    // the backend to expire.
    if (serviceOrder.value.status === 'DRAFT') {
      return createServiceOrder({ accountId, planId, planPricingId })
    }

    const isPlanChange = serviceOrder.value.planId !== planId

    if (isPlanChange) {
      return upgrade({
        id: serviceOrder.value.serviceOrderId,
        accountId,
        newPlanId: planId,
        priceId: planPricingId
      })
    }

    const isPriceChange = !!planPricingId && serviceOrder.value.priceId !== planPricingId

    if (isPriceChange) {
      // Cycle change on active SO (e.g. Pro monthly → Pro annual): create a
      // new DRAFT so the user can pay the new pricing. Active SO is preserved
      // until backend transitions it after payment confirmation.
      return createServiceOrder({ accountId, planId, planPricingId })
    }

    // Same plan + same pricing → nothing to commit
    return { success: true, data: serviceOrder.value, payment: undefined }
  }

  /**
   * Update only planPricingId of an existing DRAFT service order.
   * Used by the drawer to refresh the Stripe checkout session when the user
   * toggles billing cycle on a pending subscription.
   *
   * No-op when the SO is not DRAFT — there's no Stripe session to refresh,
   * and `/upgrade` would reject the same-plan call. Same-pricing calls are
   * also skipped to avoid redundant requests.
   *
   * @param {string} planPricingId - New plan pricing ID
   * @returns {Promise<Object|undefined>}
   */
  const updatePlanPricing = async (planPricingId) => {
    const so = serviceOrder.value
    if (!so?.serviceOrderId) return
    if (!isDraftPatchable(so)) return
    if (so.priceId && so.priceId === planPricingId) return
    if (isPaymentPendingLocked.value) return

    isSubmitting.value = true
    error.value = null
    try {
      const response = await serviceOrdersService.updateServiceOrder(so.serviceOrderId, {
        accountId: so.accountId,
        planId: so.planId,
        planPricingId
      })
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
   * Transition an active service order to a different plan (upgrade or downgrade).
   * Backend endpoint: PATCH /service_orders/:id/upgrade — handles both directions.
   * Backend requires `priceId` whenever the target plan is paid; omit for free plans.
   *
   * @param {Object} params
   * @param {string} [params.id] - Service order id (defaults to current)
   * @param {string|number} params.accountId
   * @param {string} params.newPlanId - Target plan UUID
   * @param {string} [params.priceId] - Required for paid target plans
   * @returns {Promise<Object>} { serviceOrder, newPlan, transition, immediate, payment, ... }
   */
  const upgrade = async ({ id, accountId, newPlanId, priceId }) => {
    const serviceOrderId = id || serviceOrder.value?.serviceOrderId
    if (!serviceOrderId) {
      throw new Error('Service order id is required to change plan')
    }

    isSubmitting.value = true
    error.value = null

    try {
      const response = await serviceOrdersService.upgradeServiceOrder({
        id: serviceOrderId,
        payload: { accountId, newPlanId, priceId }
      })

      if (response?.serviceOrder) {
        serviceOrder.value = response.serviceOrder
      }

      // Re-list to capture the freshly created/updated DRAFT so the next
      // mutation (e.g. PATCH on cycle change) targets the correct SO.
      if (accountId) {
        try {
          const listResp = await serviceOrdersService.listServiceOrders({
            accountId,
            status: 'DRAFT'
          })
          const draft = listResp?.data?.[0] ?? null
          if (draft) {
            serviceOrder.value = draft
            if (!response?.payment?.clientSecret && draft.priceId) {
              // best-effort: surface anything backend stuffed into the SO
              response.serviceOrder = draft
            }
          }
        } catch {
          // ignore — primary upgrade response already returned
        }
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
   * Schedule a downgrade on an active service order.
   * Backend endpoint: PATCH /service_orders/:id/downgrade — the transition is
   * applied at end of the current billing period; backend returns the SO with
   * the scheduled downgrade and the Stripe subscription_schedule reference.
   *
   * @param {Object} params
   * @param {string} [params.id] - Service order id (defaults to current)
   * @param {string} params.newPlanId - Target plan UUID
   * @returns {Promise<Object>} { serviceOrder, schedule, newPlanId, ... }
   */
  const downgrade = async ({ id, newPlanId }) => {
    const serviceOrderId = id || serviceOrder.value?.serviceOrderId
    if (!serviceOrderId) {
      throw new Error('Service order id is required to change plan')
    }

    isSubmitting.value = true
    error.value = null

    try {
      const response = await serviceOrdersService.downgradeServiceOrder({
        id: serviceOrderId,
        payload: { newPlanId }
      })

      if (response?.serviceOrder) {
        serviceOrder.value = response.serviceOrder
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
   * Reset all state
   */
  const reset = () => {
    serviceOrder.value = null
    isLoading.value = false
    isSubmitting.value = false
    error.value = null
    lockedServiceOrderIds.value = new Set()
  }

  /**
   * Fetch the full data of a single service order. Used when the drawer needs
   * to read fields that the LIST endpoint may strip (e.g. the live Stripe
   * `clientSecret` stored under `metadata`).
   *
   * @param {string} id
   * @returns {Promise<Object|null>} Transformed SO (or null on failure)
   */
  const getServiceOrder = async (id) => {
    if (!id) return null
    try {
      const response = await serviceOrdersService.getServiceOrder(id)
      const so = response?.data ?? null
      if (so) serviceOrder.value = so
      return so
    } catch (err) {
      error.value = err
      throw err
    }
  }

  return {
    // State
    serviceOrder,
    hasServiceOrder,
    isLoading,
    isSubmitting,
    error,
    isPaymentPendingLocked,

    // Actions
    loadServiceOrder,
    getServiceOrder,
    createServiceOrder,
    updateServiceOrder,
    submitServiceOrder,
    updatePlanPricing,
    upgrade,
    downgrade,
    reset
  }
}
