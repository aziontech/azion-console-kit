<template>
  <div class="flex flex-col flex-1 var(--bg-color)">
    <!-- Main Content -->
    <div
      :class="[
        'flex-1 flex flex-col items-center py-8 px-4 gap-6',
        { 'justify-center': isSuccessStep }
      ]"
    >
      <!-- Card Container (only for step 1) -->
      <div class="w-full">
        <CardBox
          v-if="isAdditionalDataStep"
          title="How are you planning to use Azion?"
          class="mx-auto max-w-xl"
        >
          <template #content>
            <div class="p-6 overflow-visible">
              <AdditionalDataFormBlock
                ref="additionalDataRef"
                @plan-change="handlePlanChange"
              />
            </div>
          </template>

          <template #footer>
            <ActionButton
              kind="primary"
              size="large"
              class="w-full"
              :label="submitButtonLabel"
              :loading="isSubmitLoading"
              :disabled="isDisabledSubmit"
              @click="onSubmit"
            />
          </template>
        </CardBox>
        <div
          v-if="shouldMountCheckout"
          class="w-full"
          :class="{ 'checkout-stage-hidden': isCheckoutPremounting }"
          :inert="isCheckoutPremounting"
          :aria-hidden="isCheckoutPremounting"
        >
          <!-- Checkout Component -->
          <ChoosingPlanContainer
            :plan="selectedPlan"
            :checkoutSessionClientSecret="checkoutSessionClientSecret"
            :draftServiceOrderId="draftServiceOrderId"
            @onSuccess="handleCheckoutSuccess"
            @onError="handleCheckoutError"
            @onBack="handleGoBack"
            @payment-element-ready="handleCheckoutElementReady"
            @stale-session="handleStaleCheckoutSession"
            @checkout-session-prepared="handleCheckoutSessionPrepared"
          />
        </div>
        <PlanSuccessBlock
          v-if="isSuccessStep"
          :plan="selectedPlan"
          @onStart="handleStartFromSuccess"
        />
      </div>
      <!-- Enterprise Link (only in step 1) -->
      <template v-if="isAdditionalDataStep">
        <div
          class="bg-surface border border-[var(--border-muted)] border-solid rounded-md px-3 py-3 w-full max-w-xl text-center"
        >
          <span class="text-xs text-[var(--text-color-secondary)]"
            >Have enterprise requirements?
          </span>
          <a
            href="https://www.azion.com/en/contact/"
            target="_blank"
            class="text-xs text-[var(--text-color-link)] hover:underline"
          >
            Get in touch
          </a>
          <span class="text-xs text-[var(--text-color-secondary)]"> with our team.</span>
        </div>

        <!-- Compare Plans Link (only in step 1) -->
        <a
          href="https://www.azion.com/en/plans/"
          target="_blank"
          class="text-xs text-[var(--text-color-link)] hover:underline flex items-center gap-1"
        >
          Compare Plans
          <i class="pi pi-arrow-right text-[10px]" />
        </a>
      </template>
    </div>
  </div>
</template>

<script setup>
  import CardBox from '@aziontech/webkit/content/card-box'
  import AdditionalDataFormBlock from '@/templates/signup-block/additional-data-form-block.vue'
  import ChoosingPlanContainer from '@/templates/signup-block/choosing-plan-container.vue'
  import PlanSuccessBlock from '@/templates/signup-block/plan-success-block.vue'
  import ActionButton from '@aziontech/webkit/button'
  import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { usePlans } from '@/composables/usePlans'
  import { usePlansList, ensurePlansList } from '@/composables/usePlansService'
  import { useAccountStore } from '@/stores/account'
  import { useServiceOrders } from '@/composables/useServiceOrders'
  import {
    preparePaidSignupCheckout,
    submitSignupPlanFromDraftOrCreate
  } from '@/composables/signup-checkout-preparation'
  import { useAdditionalDataFormState } from '@/composables/useAdditionalDataFormState'
  import { markAwaitingActiveServiceOrder } from '@/composables/post-payment-flag'
  import * as Sentry from '@sentry/vue'
  import { loadUserAndAccountInfo } from '@/helpers/account-data'
  import { useWarmStripe } from '@/composables/useWarmStripe'
  import { persistOnboardingData } from '@/helpers/persist-onboarding-data'
  import { trackSignUpSafely } from '@/helpers/track-auth-event'
  import { getFirstSessionUrl } from '@/helpers/first-session-url'
  import { queryClient } from '@/services/v2/base/query/queryClient'
  import { queryKeys } from '@/services/v2/base/query/queryKeys'

  const router = useRouter()
  /** @type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const trackSignUp = (method, payload) => {
    Promise.resolve()
      .then(() => tracker?.signUp?.[method]?.(payload)?.track?.())
      .catch(Sentry.captureException)
  }
  // Submit the sign-up to HubSpot once the additional-data has been persisted,
  // mirroring the login flow (see trackSignInSafely in sign-in-block). Reads the
  // freshly loaded account data from the store, so call it after
  // loadUserAndAccountInfo.
  const trackSignUpToHubspot = () => {
    trackSignUpSafely({
      tracker,
      method: accountStore.ssoSignUpMethod || 'email',
      signupTypeFlags: accountStore.getSignupTypeFlags(),
      firstSessionUrl: getFirstSessionUrl()
    })
  }
  const { clear: clearAdditionalDataFormState } = useAdditionalDataFormState()
  const { warmStripe } = useWarmStripe()
  const {
    initialize: initializePlans,
    plan: storedPlan,
    billingCycle: storedBillingCycle,
    clear: clearPlans
  } = usePlans()
  const accountStore = useAccountStore()
  // Auto-fetch on mount when the cache entry is stale/missing (staleTime
  // 1h). The view reads `plansData.value` reactively when preparing the
  // checkout; the explicit `ensurePlansList()` below guarantees the catalogue
  // is loaded before the SO call needs it.
  const { data: plansData } = usePlansList()
  const { prepareSignupCheckout, isLoading: isLoadingServiceOrder } = useServiceOrders()

  const additionalDataRef = ref(null)
  const currentStep = ref('additional-data') // 'additional-data' | 'checkout' | 'success'
  const selectedPlan = ref(null)
  const checkoutSessionClientSecret = ref('')
  const draftServiceOrderId = ref(null)
  const checkoutElementReady = ref(false)
  const checkoutPreparationKey = ref('')
  const isSubmitActionLoading = ref(false)
  const isAwaitingCheckoutReveal = ref(false)

  const isAdditionalDataStep = computed(() => currentStep.value === 'additional-data')
  const isCheckoutStep = computed(() => currentStep.value === 'checkout')
  const isSuccessStep = computed(() => currentStep.value === 'success')
  const shouldMountCheckout = computed(
    () =>
      selectedPlan.value === 'pro' &&
      Boolean(checkoutSessionClientSecret.value) &&
      !isSuccessStep.value
  )
  const isCheckoutPremounting = computed(() => shouldMountCheckout.value && !isCheckoutStep.value)
  const isDisabledSubmit = computed(() => {
    const metaValid = additionalDataRef.value?.meta?.valid
    return !metaValid || isSubmitLoading.value
  })

  const isSubmitLoading = computed(() => {
    const formLoading = additionalDataRef.value?.loading
    return (
      formLoading ||
      isLoadingServiceOrder.value ||
      isSubmitActionLoading.value ||
      isAwaitingCheckoutReveal.value
    )
  })

  const submitButtonLabel = computed(() => 'Continue')

  const invalidateBillingCaches = () => {
    queryClient.removeQueries({ queryKey: queryKeys.serviceOrders.all })
    queryClient.removeQueries({ queryKey: queryKeys.billing.all })
    queryClient.removeQueries({ queryKey: queryKeys.plans.all })
  }

  const DEFAULT_BILLING_CYCLE = 'monthly'
  const CHECKOUT_PREPARE_DEBOUNCE_MS = 150
  const CHECKOUT_READY_TIMEOUT_MS = 15000

  let checkoutPlansPromise = null
  let checkoutPreparationTimer = null
  let checkoutPreparationVersion = 0
  let currentCheckoutPreparationPromise = null
  const checkoutReadyResolvers = new Set()

  initializePlans({ defaultPlan: 'hobby', defaultBillingCycle: DEFAULT_BILLING_CYCLE })

  const ensureCheckoutPlans = async () => {
    if (plansData.value?.length) return plansData.value

    if (!checkoutPlansPromise) {
      checkoutPlansPromise = ensurePlansList().catch((err) => {
        checkoutPlansPromise = null
        throw err
      })
    }

    return checkoutPlansPromise
  }

  const rememberDraftServiceOrder = ({ accountId, result }) => {
    const serviceOrder = result?.serviceOrder ?? null
    const serviceOrderId = result?.draftServiceOrderId || serviceOrder?.serviceOrderId || null
    if (!serviceOrderId || accountId !== accountStore.accountData?.id) return

    draftServiceOrderId.value = serviceOrderId
  }

  const resolveCheckoutReadyWaiters = () => {
    checkoutReadyResolvers.forEach((resolve) => resolve())
    checkoutReadyResolvers.clear()
  }

  const handleCheckoutElementReady = () => {
    checkoutElementReady.value = true
    resolveCheckoutReadyWaiters()
  }

  const handleCheckoutSessionPrepared = ({ clientSecret, billingCycle } = {}) => {
    if (!clientSecret || selectedPlan.value !== 'pro') return

    const cycle = billingCycle || storedBillingCycle.value || DEFAULT_BILLING_CYCLE
    checkoutPreparationKey.value = `pro:${cycle}`
    checkoutSessionClientSecret.value = clientSecret
    checkoutElementReady.value = false
  }

  const waitForCheckoutElementReady = () => {
    if (checkoutElementReady.value) return Promise.resolve()

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        checkoutReadyResolvers.delete(done)
        resolve()
      }, CHECKOUT_READY_TIMEOUT_MS)

      const done = () => {
        clearTimeout(timeout)
        resolve()
      }

      checkoutReadyResolvers.add(done)
    })
  }

  const resetPreparedCheckout = () => {
    checkoutPreparationVersion += 1
    checkoutPreparationKey.value = ''
    checkoutSessionClientSecret.value = ''
    checkoutElementReady.value = false
    if (!isCheckoutStep.value) {
      selectedPlan.value = null
    }
  }

  const isCurrentCheckoutPreparation = ({ accountId, key, version }) =>
    version === checkoutPreparationVersion &&
    key === checkoutPreparationKey.value &&
    accountId === accountStore.accountData?.id

  const runCheckoutPreparation = async ({ accountId, plan, billingCycle, key, version }) => {
    try {
      const plans = await ensureCheckoutPlans()
      const result = await preparePaidSignupCheckout({
        accountId,
        plan,
        billingCycle,
        plans,
        prepareSignupCheckout
      })

      rememberDraftServiceOrder({ accountId, result })

      if (!isCurrentCheckoutPreparation({ accountId, key, version })) {
        return null
      }

      selectedPlan.value = plan
      checkoutSessionClientSecret.value = result.clientSecret
      checkoutElementReady.value = false

      return result
    } catch (err) {
      if (version === checkoutPreparationVersion) {
        checkoutSessionClientSecret.value = ''
        checkoutElementReady.value = false
      }
      throw err
    }
  }

  const prepareProCheckout = ({ billingCycle, force = false } = {}) => {
    const plan = 'pro'
    const cycle = billingCycle || storedBillingCycle.value || DEFAULT_BILLING_CYCLE
    const key = `${plan}:${cycle}`
    const accountId = accountStore.accountData?.id

    if (
      !force &&
      checkoutPreparationKey.value === key &&
      checkoutSessionClientSecret.value &&
      !currentCheckoutPreparationPromise
    ) {
      return Promise.resolve({
        clientSecret: checkoutSessionClientSecret.value,
        draftServiceOrderId: draftServiceOrderId.value,
        serviceOrder: null
      })
    }

    if (currentCheckoutPreparationPromise && checkoutPreparationKey.value === key) {
      return currentCheckoutPreparationPromise
    }

    const version = ++checkoutPreparationVersion
    checkoutPreparationKey.value = key
    checkoutSessionClientSecret.value = ''
    checkoutElementReady.value = false
    selectedPlan.value = plan

    const trackedPreparation = runCheckoutPreparation({
      accountId,
      plan,
      billingCycle: cycle,
      key,
      version
    }).finally(() => {
      if (currentCheckoutPreparationPromise === trackedPreparation) {
        currentCheckoutPreparationPromise = null
      }
    })
    currentCheckoutPreparationPromise = trackedPreparation

    return currentCheckoutPreparationPromise
  }

  const scheduleProCheckoutPreparation = () => {
    if (checkoutPreparationTimer) {
      clearTimeout(checkoutPreparationTimer)
      checkoutPreparationTimer = null
    }

    const accountId = accountStore.accountData?.id
    const plan = storedPlan.value || additionalDataRef.value?.plan
    const billingCycle = storedBillingCycle.value || DEFAULT_BILLING_CYCLE

    if (!isAdditionalDataStep.value || !accountId) return

    if (plan !== 'pro') {
      resetPreparedCheckout()
      return
    }

    const key = `${plan}:${billingCycle}`
    if (
      checkoutPreparationKey.value === key &&
      (checkoutSessionClientSecret.value || currentCheckoutPreparationPromise)
    ) {
      return
    }

    checkoutPreparationTimer = setTimeout(() => {
      checkoutPreparationTimer = null
      prepareProCheckout({ billingCycle }).catch(Sentry.captureException)
    }, CHECKOUT_PREPARE_DEBOUNCE_MS)
  }

  const handlePlanChange = ({ plan, billingCycle } = {}) => {
    if (!isAdditionalDataStep.value || !accountStore.accountData?.id) return

    if (checkoutPreparationTimer) {
      clearTimeout(checkoutPreparationTimer)
      checkoutPreparationTimer = null
    }

    if (plan !== 'pro') {
      resetPreparedCheckout()
      return
    }

    prepareProCheckout({ billingCycle: billingCycle || DEFAULT_BILLING_CYCLE }).catch(
      Sentry.captureException
    )
  }

  // Handlers
  const onSubmit = async () => {
    const plan = additionalDataRef.value?.plan
    const accountId = accountStore.accountData?.id
    const billingCycle = storedBillingCycle.value || DEFAULT_BILLING_CYCLE

    if (!plan || !accountId) return

    trackSignUp('planSelected', { plan, billingCycle })
    isSubmitActionLoading.value = true

    if (plan === 'hobby') {
      try {
        await persistOnboardingData({ plan })
        const plans = await ensureCheckoutPlans()
        const result = await submitSignupPlanFromDraftOrCreate({
          accountId,
          plan,
          billingCycle,
          plans,
          prepareSignupCheckout
        })
        if (result?.draftServiceOrderId) {
          draftServiceOrderId.value = null
        }

        invalidateBillingCaches()
        await loadUserAndAccountInfo({ force: true })
        trackSignUpToHubspot()
        handleProceedToCheckout()
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to activate hobby plan:', err)
      } finally {
        isSubmitActionLoading.value = false
      }
      return
    }

    try {
      isAwaitingCheckoutReveal.value = true
      const result = await prepareProCheckout({ billingCycle, force: false })
      if (result?.draftServiceOrderId) {
        draftServiceOrderId.value = result.draftServiceOrderId
      }
      if (!checkoutSessionClientSecret.value) {
        throw new Error('Unable to initialize payment. Please try again.')
      }
      await waitForCheckoutElementReady()
      trackSignUp('checkoutStarted', { plan, billingCycle })
      currentStep.value = 'checkout'
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to submit service order:', err)
      currentStep.value = 'additional-data'
    } finally {
      isAwaitingCheckoutReveal.value = false
      isSubmitActionLoading.value = false
    }
  }

  const handleProceedToCheckout = () => {
    selectedPlan.value = additionalDataRef.value?.plan

    if (additionalDataRef.value?.plan === 'hobby') {
      // For hobby plan, skip checkout and show success
      currentStep.value = 'success'
      return
    }

    trackSignUp('checkoutStarted', {
      plan: selectedPlan.value,
      billingCycle: storedBillingCycle.value
    })
    currentStep.value = 'checkout'
  }

  const handleGoBack = () => {
    currentStep.value = 'additional-data'
  }

  const handleCheckoutSuccess = async (checkoutData) => {
    trackSignUp('paymentMethodSubmitted', {
      plan: selectedPlan.value,
      billingCycle: storedBillingCycle.value,
      methodType: checkoutData?.methodType || 'card'
    })
    trackSignUp('paymentConfirmed', {
      plan: selectedPlan.value,
      billingCycle: storedBillingCycle.value,
      amount: checkoutData?.amount,
      currency: checkoutData?.currency || 'USD'
    })
    markAwaitingActiveServiceOrder()
    try {
      await persistOnboardingData({ plan: selectedPlan.value })
      invalidateBillingCaches()
      await loadUserAndAccountInfo({ force: true })
      trackSignUpToHubspot()
    } catch (err) {
      Sentry.captureException(err)
    }
    currentStep.value = 'success'
  }

  const handleCheckoutError = (error) => {
    const message =
      (Array.isArray(error?.message) ? error.message[0] : error?.message) || 'Checkout error'
    trackSignUp('paymentFailed', {
      errorType: error?.type || 'payment',
      errorMessage: message,
      gateway: 'stripe'
    })
    // eslint-disable-next-line no-console
    console.error('Checkout error:', error)
  }

  const handleStaleCheckoutSession = async ({ billingCycle } = {}) => {
    const cycle = billingCycle || storedBillingCycle.value || DEFAULT_BILLING_CYCLE
    try {
      await prepareProCheckout({ billingCycle: cycle, force: true })
    } catch (err) {
      Sentry.captureException(err)
      handleCheckoutError(err)
    }
  }

  const handleStartFromSuccess = () => {
    invalidateBillingCaches()
    router.push({ name: 'home' })
  }

  watch(isSuccessStep, (reachedSuccess) => {
    if (!reachedSuccess) return
    clearAdditionalDataFormState()
    clearPlans()
  })

  watch(
    [
      () => storedPlan.value,
      () => storedBillingCycle.value,
      () => plansData.value,
      () => accountStore.accountData?.id,
      () => currentStep.value
    ],
    scheduleProCheckoutPreparation,
    { immediate: true }
  )

  onMounted(async () => {
    // Warm Stripe.js while the user fills the additional-data form so the Pro
    // checkout step (the very next screen) reuses the already-downloaded
    // client instead of blocking on a cold js.stripe.com load.
    warmStripe()
    // Cache-aware: uses existing plans when fresh. The checkout prepare
    // endpoint now resolves/reuses any DRAFT service order server-side.
    await ensureCheckoutPlans()
    scheduleProCheckoutPreparation()
  })

  onBeforeUnmount(() => {
    if (checkoutPreparationTimer) {
      clearTimeout(checkoutPreparationTimer)
      checkoutPreparationTimer = null
    }
    checkoutPreparationVersion += 1
    checkoutReadyResolvers.clear()
  })
</script>

<style scoped>
  .label-fade-enter-active,
  .label-fade-leave-active {
    transition: opacity 150ms ease;
  }

  .label-fade-enter-from,
  .label-fade-leave-to {
    opacity: 0;
  }

  .step-fade-enter-active,
  .step-fade-leave-active {
    transition: opacity 200ms ease;
  }

  .step-fade-enter-from,
  .step-fade-leave-to {
    opacity: 0;
  }

  .checkout-stage-hidden {
    position: fixed;
    top: 0;
    left: -200vw;
    width: min(100vw, 960px);
    height: 800px;
    opacity: 0;
    pointer-events: none;
  }
</style>
