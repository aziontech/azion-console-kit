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
              <AdditionalDataFormBlock ref="additionalDataRef" />
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
          v-else-if="isCheckoutStep"
          class="w-full"
        >
          <!-- Checkout Component -->
          <ChoosingPlanContainer
            :plan="selectedPlan"
            :checkoutSessionClientSecret="checkoutSessionClientSecret"
            ref="checkoutRef"
            @onSuccess="handleCheckoutSuccess"
            @onError="handleCheckoutError"
            @onBack="handleGoBack"
          />
        </div>
        <PlanSuccessBlock
          v-else-if="isSuccessStep"
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
          href="https://www.azion.com/en/pricing/"
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
  import ActionButton from '@aziontech/webkit/actions/button'
  import { computed, inject, onMounted, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { usePlans } from '@/composables/usePlans'
  import { usePlansList, ensurePlansList, getPlanPricingId } from '@/composables/usePlansService'
  import { useAccountStore } from '@/stores/account'
  import { useServiceOrders } from '@/composables/useServiceOrders'
  import { useAdditionalDataFormState } from '@/composables/useAdditionalDataFormState'
  import { markAwaitingActiveServiceOrder } from '@/composables/post-payment-flag'
  import * as Sentry from '@sentry/vue'
  import { loadUserAndAccountInfo } from '@/helpers/account-data'
  import { persistOnboardingData } from '@/helpers/persist-onboarding-data'
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
  const { clear: clearAdditionalDataFormState } = useAdditionalDataFormState()
  const {
    initialize: initializePlans,
    billingCycle: storedBillingCycle,
    clear: clearPlans
  } = usePlans()
  const accountStore = useAccountStore()
  // Auto-fetch on mount when the cache entry is stale/missing (staleTime
  // 1h). The view reads `plansData.value` reactively in helpers like
  // `getPlanIdFromName`; the explicit `ensurePlansList()` below guarantees
  // the catalogue is loaded before the SO call needs it.
  const { data: plansData } = usePlansList()
  const {
    loadAccountServiceOrders,
    submitServiceOrder,
    isLoading: isLoadingServiceOrder,
    isSubmitting: isSubmittingServiceOrder
  } = useServiceOrders()

  const additionalDataRef = ref(null)
  const currentStep = ref('additional-data') // 'additional-data' | 'checkout' | 'success'
  const selectedPlan = ref(null)
  const checkoutSessionClientSecret = ref('')

  const isAdditionalDataStep = computed(() => currentStep.value === 'additional-data')
  const isCheckoutStep = computed(() => currentStep.value === 'checkout')
  const isSuccessStep = computed(() => currentStep.value === 'success')
  const isDisabledSubmit = computed(() => {
    const metaValid = additionalDataRef.value?.meta?.valid
    return !metaValid || isSubmitLoading.value
  })

  const isSubmitLoading = computed(() => {
    const formLoading = additionalDataRef.value?.loading
    const serviceOrderLoading = isLoadingServiceOrder.value || isSubmittingServiceOrder.value
    return formLoading || serviceOrderLoading
  })

  const submitButtonLabel = computed(() => 'Continue')
  const getPlanIdFromName = (planName) => {
    if (!plansData.value?.length) return null
    const foundPlan = plansData.value.find(
      (planItem) => planItem.sku?.toLowerCase() === planName?.toLowerCase()
    )
    return foundPlan?.id || null
  }

  const invalidateBillingCaches = () => {
    queryClient.removeQueries({ queryKey: queryKeys.serviceOrders.all })
    queryClient.removeQueries({ queryKey: queryKeys.billing.all })
    queryClient.removeQueries({ queryKey: queryKeys.plans.all })
  }

  // Handlers
  const onSubmit = async () => {
    const plan = additionalDataRef.value?.plan
    const accountId = accountStore.accountData?.id
    const billingCycle = storedBillingCycle.value || 'yearly'

    if (!plan || !accountId) return

    trackSignUp('planSelected', { plan, billingCycle })

    const planId = getPlanIdFromName(plan)
    if (!planId) return

    if (plan === 'hobby') {
      try {
        await persistOnboardingData({ plan })
        await submitServiceOrder({ accountId, planId })

        invalidateBillingCaches()
        await loadUserAndAccountInfo({ force: true })
        handleProceedToCheckout()
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to activate hobby plan:', err)
      }
      return
    }

    const planPricingId = getPlanPricingId(plansData.value, plan, billingCycle)
    if (!planPricingId) return

    checkoutSessionClientSecret.value = ''
    selectedPlan.value = plan
    trackSignUp('checkoutStarted', { plan, billingCycle })
    currentStep.value = 'checkout'

    try {
      const serviceOrderResponse = await submitServiceOrder({ accountId, planId, planPricingId })
      const secret =
        serviceOrderResponse?.payment?.clientSecret ||
        serviceOrderResponse?.data?.clientSecret ||
        ''

      if (!secret) {
        // eslint-disable-next-line no-console
        console.error('Unable to initialize payment. Please try again.')
        currentStep.value = 'additional-data'
        return
      }

      checkoutSessionClientSecret.value = secret
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to submit service order:', err)
      currentStep.value = 'additional-data'
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

  const handleStartFromSuccess = () => {
    invalidateBillingCaches()
    router.push({ name: 'home' })
  }

  watch(isSuccessStep, (reachedSuccess) => {
    if (!reachedSuccess) return
    clearAdditionalDataFormState()
    clearPlans()
  })

  onMounted(async () => {
    initializePlans()
    // Cache-aware: uses the existing plans entry when fresh, fetches only
    // when stale/missing. Replaces the previous `refetch()` call that
    // always hit the network.
    await ensurePlansList()
    const accountId = accountStore.accountData?.id
    if (accountId) {
      const { draft } = await loadAccountServiceOrders(accountId)
      if (draft?.clientSecret) {
        checkoutSessionClientSecret.value = draft.clientSecret
      }
    }
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
</style>
