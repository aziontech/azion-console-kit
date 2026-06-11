<template>
  <Sidebar
    v-model:visible="visibleDrawer"
    position="right"
    :pt="sidebarPt"
  >
    <div class="flex h-full">
      <div
        class="hidden md:block w-[300px] shrink-0 border-r border-[var(--border-default)] bg-surface"
      >
        <CheckoutFeaturesBlock :plan="plan" />
      </div>

      <div class="flex flex-1 flex-col min-w-0 bg-surface">
        <div
          class="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border-default)] px-4 md:px-8"
        >
          <h2 class="text-[17.5px] font-semibold leading-[21px] text-default">
            {{ headerLabel }}
          </h2>
          <button
            type="button"
            aria-label="Close"
            class="flex h-8 w-8 items-center justify-center rounded-md text-default hover:bg-white/5 transition-colors"
            @click="closeDrawer"
          >
            <i class="pi pi-times text-sm" />
          </button>
        </div>

        <div
          class="checkout-scroll-area flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 md:px-8"
        >
          <PricingCalculationBlock
            ref="pricingRef"
            :plan="plan"
            :lockedCycle="lockedCycle"
            :mode="mode"
            @update:billing-cycle="handleBillingCycleChange"
            @update:checkout-session-client-secret="handleCheckoutSessionClientSecretChange"
          />

          <PaymentMethodSummary
            v-if="showDefaultPaymentSummary"
            :card="defaultPaymentCard"
            @swap="handleSwapPaymentMethod"
          />

          <template v-else-if="isChangeCycleMode">
            <PaymentMethodSetupBlock
              ref="paymentSetupRef"
              :stripeClientService="getStripeClientService"
              :clientSecret="setupIntentClientSecret"
              @readiness-change="handlePaymentReadinessChange"
              @cancel="handleCancelPaymentSwap"
            />
          </template>

          <template v-else>
            <PaymentMethodBlock
              ref="paymentRef"
              :stripeClientService="getStripeClientService"
              :checkoutSessionClientSecret="checkoutSessionClientSecret"
              @readiness-change="handlePaymentReadinessChange"
              @stale-session="$emit('stale-session', { plan, billingCycle })"
            />

            <AddressInformationBlock
              ref="addressRef"
              :showUseOwnerInfo="true"
              @readiness-change="handleAddressReadinessChange"
            />
          </template>

          <TermsAcceptanceBlock v-model="isTermsAccepted" />
        </div>

        <CheckoutSubmissionFooter
          :submitLabel="submitLabel"
          :isSubmitting="isSubmitting"
          :isConfirmDisabled="isConfirmDisabled"
          @cancel="closeDrawer"
          @confirm="handleSubmit"
        />
      </div>
    </div>
  </Sidebar>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import Sidebar from '@aziontech/webkit/sidebar'
  import CheckoutFeaturesBlock from '@/templates/checkout-block/checkout-features-block.vue'
  import PricingCalculationBlock from '@/templates/checkout-block/pricing-calculation-block.vue'
  import PaymentMethodBlock from '@/templates/checkout-block/payment-method-block.vue'
  import PaymentMethodSetupBlock from '@/templates/checkout-block/payment-method-setup-block.vue'
  import PaymentMethodSummary from '@/views/Billing/Drawer/blocks/PaymentMethodSummary.vue'
  import AddressInformationBlock from '@/templates/checkout-block/address-information-block.vue'
  import TermsAcceptanceBlock from '@/templates/checkout-block/terms-acceptance-block.vue'
  import CheckoutSubmissionFooter from '@/views/Billing/Drawer/CheckoutSubmissionFooter.vue'
  import { usePlans } from '@/composables/usePlans'
  import { useBillingPaymentMethods } from '@/composables/useBillingPaymentMethods'
  import { useUpdateDefaultPaymentMethod } from '@/composables/useUpdateDefaultPaymentMethod'
  import { useToast } from '@aziontech/webkit/use-toast'

  defineOptions({ name: 'drawer-plan-info' })

  const props = defineProps({
    visible: { type: Boolean, default: false },
    plan: {
      type: String,
      default: 'pro',
      validator: (value) => ['pro', 'hobby'].includes(value)
    },
    mode: {
      type: String,
      default: 'subscribe',
      validator: (value) => ['subscribe', 'edit', 'change-cycle'].includes(value)
    },
    lockedCycle: {
      type: String,
      default: null,
      validator: (value) => value === null || ['monthly', 'yearly'].includes(value)
    },
    initialClientSecret: { type: String, default: '' },
    getStripeClientService: { type: Function, required: false, default: null },
    indented: { type: Boolean, default: false }
  })

  const sidebarPt = computed(() => {
    const rootBase = 'w-full md:w-[960px] md:max-w-[calc(100vw-160px)] border-l surface-border'
    return {
      root: {
        class: props.indented ? `${rootBase} shadow-[-12px_0_32px_-8px_rgba(0,0,0,0.45)]` : rootBase
      },
      header: { class: 'hidden' },
      content: { class: 'p-0 overflow-hidden' }
    }
  })

  const emit = defineEmits(['update:visible', 'submit', 'submitCycleChange', 'stale-session'])

  const toast = useToast()
  const { setParam } = usePlans()

  const pricingRef = ref(null)
  const paymentRef = ref(null)
  const paymentSetupRef = ref(null)
  const addressRef = ref(null)
  const isSubmitting = ref(false)
  const isPaymentFormReady = ref(false)
  const isAddressFormReady = ref(false)
  const billingCycle = ref('yearly')
  const checkoutSessionClientSecret = ref(props.initialClientSecret)
  const setupIntentClientSecret = ref('')
  const useDefaultPaymentMethod = ref(true)
  const isTermsAccepted = ref(false)

  const { defaultPaymentMethod: defaultPaymentCard } = useBillingPaymentMethods()
  const { createSetupIntent, setDefault: setDefaultPaymentMethod } = useUpdateDefaultPaymentMethod()

  const isChangeCycleMode = computed(() => props.mode === 'change-cycle')

  const showDefaultPaymentSummary = computed(
    () => useDefaultPaymentMethod.value && Boolean(defaultPaymentCard.value)
  )

  const handleSwapPaymentMethod = async () => {
    useDefaultPaymentMethod.value = false
    if (!isChangeCycleMode.value) return
    isPaymentFormReady.value = false
    try {
      const { clientSecret } = await createSetupIntent()
      if (!clientSecret) {
        throw new Error('Setup intent client secret missing in response.')
      }
      setupIntentClientSecret.value = clientSecret
    } catch (err) {
      useDefaultPaymentMethod.value = true
      showError(err?.message || 'Unable to initialize payment method update.')
    }
  }

  const handleCancelPaymentSwap = () => {
    setupIntentClientSecret.value = ''
    isPaymentFormReady.value = false
    useDefaultPaymentMethod.value = true
  }

  const visibleDrawer = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const headerLabel = computed(() => {
    if (isChangeCycleMode.value) {
      return props.lockedCycle === 'yearly' ? 'Upgrade to Yearly' : 'Change Cycle'
    }
    if (props.mode === 'edit') return 'Edit Plan'
    const labels = { pro: 'Upgrade to Pro', hobby: 'Subscribe to Hobby' }
    return labels[props.plan] || `Upgrade to ${props.plan}`
  })

  const submitLabel = computed(() => {
    if (isChangeCycleMode.value) return 'Confirm'
    return props.mode === 'edit' ? 'Update Plan' : 'Subscribe'
  })

  const isConfirmDisabled = computed(() => {
    if (isSubmitting.value) return true
    if (!isTermsAccepted.value) return true
    if (isChangeCycleMode.value) {
      if (showDefaultPaymentSummary.value) return false
      return !setupIntentClientSecret.value || !isPaymentFormReady.value
    }
    if (showDefaultPaymentSummary.value) return !checkoutSessionClientSecret.value
    return (
      !checkoutSessionClientSecret.value || !isPaymentFormReady.value || !isAddressFormReady.value
    )
  })

  const handleBillingCycleChange = (value) => {
    billingCycle.value = value
  }

  const handleCheckoutSessionClientSecretChange = (value) => {
    checkoutSessionClientSecret.value = value
  }

  const handlePaymentReadinessChange = (isReady) => {
    isPaymentFormReady.value = Boolean(isReady)
  }

  const handleAddressReadinessChange = (isReady) => {
    isAddressFormReady.value = Boolean(isReady)
  }

  const closeDrawer = () => {
    emit('update:visible', false)
  }

  const showError = (detail) => {
    toast.add({ severity: 'error', summary: 'Error', detail: String(detail), closable: true })
  }

  watch(
    () => props.visible,
    (visible) => {
      if (visible) {
        isTermsAccepted.value = false
        setParam('plan', props.plan)
      }
    },
    { immediate: true }
  )

  watch(
    () => props.initialClientSecret,
    (secret) => {
      if (secret && secret !== checkoutSessionClientSecret.value) {
        checkoutSessionClientSecret.value = secret
      }
    }
  )

  const handleSubmit = async () => {
    if (isSubmitting.value) return
    isSubmitting.value = true
    try {
      if (isChangeCycleMode.value) {
        if (!showDefaultPaymentSummary.value) {
          const newPaymentMethodId = await paymentSetupRef.value?.confirmSetup?.()
          if (!newPaymentMethodId) {
            throw new Error('Unable to confirm new payment method.')
          }
          await setDefaultPaymentMethod(newPaymentMethodId)
          setupIntentClientSecret.value = ''
          useDefaultPaymentMethod.value = true
        }
        await new Promise((resolve, reject) => {
          emit('submitCycleChange', {
            plan: props.plan,
            billingCycle: billingCycle.value,
            done: resolve,
            fail: (err) =>
              reject(typeof err === 'string' ? new Error(err) : err || new Error('Failed'))
          })
        })
        return
      }

      if (showDefaultPaymentSummary.value) {
        emit('submit', {
          plan: props.plan,
          billingCycle: billingCycle.value,
          useDefaultPaymentMethod: true,
          paymentMethodId: defaultPaymentCard.value?.id ?? null
        })
        return
      }

      const paymentErrors = await paymentRef.value?.validate?.()
      if (paymentErrors && Object.keys(paymentErrors).length > 0) return

      const address = await addressRef.value?.saveAddress?.()
      if (!address) return

      const checkoutConfirmation = await paymentRef.value?.confirmCheckoutSession?.()
      if (checkoutConfirmation?.type !== 'success') {
        throw new Error('Payment could not be completed. Please try again.')
      }

      emit('submit', {
        plan: props.plan,
        billingCycle: billingCycle.value,
        paymentIntentId: checkoutConfirmation?.paymentIntent?.id,
        paymentStatus: checkoutConfirmation?.paymentIntent?.status,
        address: {
          postalCode: address.postalCode,
          country: addressRef.value?.getCountry?.(Number(address.country)) || '',
          countryId: address.country,
          region: address.region,
          city: address.city,
          address: address.address
        }
      })
    } catch (err) {
      const detail =
        (Array.isArray(err?.message) ? err.message[0] : err?.message) || 'Unable to subscribe.'
      showError(detail)
    } finally {
      isSubmitting.value = false
    }
  }
</script>

<style scoped>
  .checkout-scroll-area {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .checkout-scroll-area::-webkit-scrollbar {
    display: none;
  }
</style>
