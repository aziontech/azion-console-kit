<template>
  <div class="flex flex-col min-h-screen var(--bg-color)">
    <!-- Main Content -->
    <div class="flex-1 flex flex-col items-center py-8 px-4 gap-6">
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
            <Button
              severity="primary"
              class="w-full font-protomono flex items-center justify-center"
              :disabled="isDisabledSubmit"
              @click="onSubmit"
            >
              <span class="inline-flex items-center gap-2">
                <Transition
                  name="label-fade"
                  mode="out-in"
                >
                  <span :key="submitButtonLabel">{{ submitButtonLabel }}</span>
                </Transition>
                <i
                  v-if="isSubmitLoading"
                  class="pi pi-spinner pi-spin text-xs animate-spin"
                  aria-hidden="true"
                />
              </span>
            </Button>
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
          class="bg-[var(--surface-100)] border border-[var(--surface-border)] border-solid rounded-md px-3 py-3 w-full max-w-xl text-center"
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
  import CardBox from '@aziontech/webkit/card-box'
  import AdditionalDataFormBlock from '@/templates/signup-block/additional-data-form-block.vue'
  import ChoosingPlanContainer from '@/templates/signup-block/choosing-plan-container.vue'
  import PlanSuccessBlock from '@/templates/signup-block/plan-success-block.vue'
  import Button from '@aziontech/webkit/button'
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { usePlans } from '@/composables/usePlans'
  import { usePlansList, ensurePlansList, getPlanPricingId } from '@/composables/usePlansService'
  import { useAccountStore } from '@/stores/account'
  import { useServiceOrders } from '@/composables/useServiceOrders'
  import { useAdditionalDataFormState } from '@/composables/useAdditionalDataFormState'
  import { loadUserAndAccountInfo } from '@/helpers/account-data'

  const router = useRouter()
  const { clear: clearAdditionalDataFormState } = useAdditionalDataFormState()
  const { initialize: initializePlans, billingCycle: storedBillingCycle } = usePlans()
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

  const submitButtonLabel = computed(() => {
    const plan = additionalDataRef.value?.plan
    if (plan === 'hobby') return 'Start Deploying'
    return 'Continue'
  })
  const getPlanIdFromName = (planName) => {
    if (!plansData.value?.length) return null
    const foundPlan = plansData.value.find(
      (planItem) => planItem.sku?.toLowerCase() === planName?.toLowerCase()
    )
    return foundPlan?.id || null
  }

  // Handlers
  const onSubmit = async () => {
    const plan = additionalDataRef.value?.plan
    const accountId = accountStore.accountData?.id
    const billingCycle = storedBillingCycle.value || 'yearly'

    await additionalDataRef.value?.submitForm()

    if (!plan || !accountId) return

    const planId = getPlanIdFromName(plan)
    if (!planId) return

    if (plan === 'hobby') {
      // Onboarding only enters when has_service_order_plan === false, so no
      // ACTIVE SO can exist yet — what may exist is a DRAFT from a previous
      // attempt. submitServiceOrder already routes: no SO → POST hobby;
      // DRAFT (any plan) → PATCH to hobby; same plan → no-op.
      try {
        await submitServiceOrder({ accountId, planId })

        // Refresh /info so accountGuard sees has_service_order_plan=true and
        // doesn't bounce back to additional-data on reload.
        await loadUserAndAccountInfo()
        handleProceedToCheckout()
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to activate hobby plan:', err)
      }
      return
    }

    const planPricingId = getPlanPricingId(plansData.value, plan, billingCycle)
    if (!planPricingId) return

    try {
      const serviceOrderResponse = await submitServiceOrder({ accountId, planId, planPricingId })
      // Adapter surfaces the Stripe client secret in two places depending on
      // where the backend put it: top-level `payment` (explicit field) or on
      // the SO itself when extracted from `metadata.client_secret`.
      checkoutSessionClientSecret.value =
        serviceOrderResponse?.payment?.clientSecret ||
        serviceOrderResponse?.data?.clientSecret ||
        ''

      if (!checkoutSessionClientSecret.value) {
        // eslint-disable-next-line no-console
        console.error('Unable to initialize payment. Please try again.')
        return
      }

      handleProceedToCheckout()
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to submit service order:', err)
    }
  }

  const handleProceedToCheckout = () => {
    selectedPlan.value = additionalDataRef.value?.plan

    if (additionalDataRef.value?.plan === 'hobby') {
      // For hobby plan, skip checkout and show success
      currentStep.value = 'success'
      return
    }

    currentStep.value = 'checkout'
  }

  const handleGoBack = () => {
    currentStep.value = 'additional-data'
  }

  const handleCheckoutSuccess = async () => {
    currentStep.value = 'success'
  }

  const handleCheckoutError = (error) => {
    // eslint-disable-next-line no-console
    console.error('Checkout error:', error)
  }

  const handleStartFromSuccess = () => {
    clearAdditionalDataFormState()
    router.push({ name: 'home' })
  }

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
