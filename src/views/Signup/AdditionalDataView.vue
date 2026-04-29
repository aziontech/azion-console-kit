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
              <AdditionalDataFormBlock
                :postAdditionalDataService="SignupServices.postAdditionalDataService"
                :patchFullnameService="SignupServices.patchFullnameService"
                :updateAccountInfoService="SignupServices.updateAccountInfoService"
                ref="additionalDataRef"
                @proceedToCheckout="handleProceedToCheckout"
              />
            </div>
          </template>

          <template #footer>
            <Button
              severity="primary"
              class="w-full font-protomono flex items-center justify-center"
              :disabled="isDisabledSubmit"
              @click="onSubmit"
            >
              <Transition
                name="label-fade"
                mode="out-in"
              >
                <span :key="submitButtonLabel">{{ submitButtonLabel }}</span>
              </Transition>
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
            :getStripeClientService="getStripeClientService"
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
  import CardBox from '@aziontech/webkit/card-box'
  import AdditionalDataFormBlock from '@/templates/signup-block/additional-data-form-block.vue'
  import ChoosingPlanContainer from '@/templates/signup-block/choosing-plan-container.vue'
  import PlanSuccessBlock from '@/templates/signup-block/plan-success-block.vue'
  import Button from '@aziontech/webkit/button'
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { usePlans } from '@/composables/usePlans'
  import { usePlansList, getPlanPricingId } from '@/composables/usePlansService'
  import { useAccountStore } from '@/stores/account'
  import { useServiceOrders } from '@/composables/useServiceOrders'
  import { useAdditionalDataFormState } from '@/composables/useAdditionalDataFormState'
  import * as SignupServices from '@/services/signup-services'
  import { getStripeClientService } from '@/services/billing-services'

  const router = useRouter()
  const { clear: clearAdditionalDataFormState } = useAdditionalDataFormState()
  const { initialize: initializePlans, billingCycle: storedBillingCycle } = usePlans()
  const accountStore = useAccountStore()
  const { data: plansData, refetch: loadPlans } = usePlansList({ enabled: false })
  const {
    loadServiceOrder,
    submitServiceOrder,
    isLoading: isLoadingServiceOrder,
    isSubmitting: isSubmittingServiceOrder
  } = useServiceOrders()

  // Helper to resolve planId from plan name
  const getPlanIdFromName = (planName) => {
    if (!plansData.value?.length) return null
    const foundPlan = plansData.value.find(
      (planItem) => planItem.sku?.toLowerCase() === planName?.toLowerCase()
    )
    return foundPlan?.id || null
  }

  const additionalDataRef = ref(null)

  // Step management
  const currentStep = ref('additional-data') // 'additional-data' | 'checkout' | 'success'
  const selectedPlan = ref(null)

  const isAdditionalDataStep = computed(() => currentStep.value === 'additional-data')
  const isCheckoutStep = computed(() => currentStep.value === 'checkout')
  const isSuccessStep = computed(() => currentStep.value === 'success')
  // Step 1 state
  const isDisabledSubmit = computed(() => {
    const metaValid = additionalDataRef.value?.meta?.valid
    const formLoading = additionalDataRef.value?.loading
    const serviceOrderLoading = isLoadingServiceOrder.value || isSubmittingServiceOrder.value
    return !metaValid || formLoading || serviceOrderLoading
  })

  const submitButtonLabel = computed(() => {
    const plan = additionalDataRef.value?.plan
    if (plan === 'hobby') return 'Start Deploying'
    return 'Continue'
  })

  onMounted(async () => {
    initializePlans()
    await loadPlans()
    const accountId = accountStore.accountData?.id
    if (accountId) {
      await loadServiceOrder(accountId)
    }
  })

  // Handlers
  const onSubmit = async () => {
    const plan = additionalDataRef.value?.plan
    const accountId = accountStore.accountData?.id
    const billingCycle = storedBillingCycle.value || 'yearly'

    await additionalDataRef.value?.submitForm()

    // Handle service order (create or update) before proceeding
    if (plan && accountId) {
      const planId = getPlanIdFromName(plan)
      const planPricingId = getPlanPricingId(plansData.value, plan, billingCycle)

      if (planId && planPricingId) {
        await submitServiceOrder({ accountId, planId, planPricingId })
        handleProceedToCheckout()
      }
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

  const handleCheckoutSuccess = () => {
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
