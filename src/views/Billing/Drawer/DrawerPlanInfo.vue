<template>
  <Sidebar
    v-model:visible="visibleDrawer"
    position="right"
    :pt="{
      root: { class: 'w-full md:w-[960px] md:max-w-[calc(100vw-160px)] border-l surface-border' },
      header: { class: 'hidden' },
      content: { class: 'p-0 overflow-hidden' }
    }"
  >
    <div class="flex h-full">
      <div class="hidden md:block w-[300px] shrink-0 border-r border-default bg-surface">
        <CheckoutFeaturesBlock :plan="plan" />
      </div>

      <div class="flex flex-1 flex-col min-w-0 bg-surface">
        <div
          class="flex h-14 shrink-0 items-center justify-between border-b border-default px-4 md:px-8"
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
            @update:billing-cycle="handleBillingCycleChange"
            @update:checkout-session-client-secret="handleCheckoutSessionClientSecretChange"
          />

          <PaymentMethodBlock
            ref="paymentRef"
            :stripeClientService="getStripeClientService"
            :checkoutSessionClientSecret="checkoutSessionClientSecret"
            @readiness-change="handlePaymentReadinessChange"
          />

          <AddressInformationBlock
            ref="addressRef"
            :showUseOwnerInfo="true"
            @readiness-change="handleAddressReadinessChange"
          />
        </div>

        <CheckoutSubmissionFooter
          :submitLabel="submitLabel"
          :errorMessage="submitError"
          :isSubmitting="isSubmitting"
          :isConfirmDisabled="isSubscribeDisabled"
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
  import AddressInformationBlock from '@/templates/checkout-block/address-information-block.vue'
  import CheckoutSubmissionFooter from '@/views/Billing/Drawer/CheckoutSubmissionFooter.vue'
  import { usePlans } from '@/composables/usePlans'
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
      validator: (value) => ['subscribe', 'edit'].includes(value)
    },
    /**
     * When set, locks the billing cycle toggle inside the drawer. Used when
     * the drawer was opened specifically to change cycle on the same plan
     * (e.g. Pro/m → Pro/y), so the user can't accidentally pick the other
     * cycle here.
     */
    lockedCycle: {
      type: String,
      default: null,
      validator: (value) => value === null || ['monthly', 'yearly'].includes(value)
    },
    /**
     * Stripe checkout session client secret, pre-fetched by the caller before
     * opening the drawer. Mirrors the working signup pattern: when the drawer
     * mounts, `PaymentMethodBlock` already receives a valid secret and the
     * Stripe element renders on the first paint — no async race.
     */
    initialClientSecret: { type: String, default: '' },
    getStripeClientService: { type: Function, required: true }
  })

  const emit = defineEmits(['update:visible', 'submit'])

  const toast = useToast()
  const { setParam } = usePlans()

  const pricingRef = ref(null)
  const paymentRef = ref(null)
  const addressRef = ref(null)
  const isSubmitting = ref(false)
  const isPaymentFormReady = ref(false)
  const isAddressFormReady = ref(false)
  const billingCycle = ref('yearly')
  const checkoutSessionClientSecret = ref(props.initialClientSecret)
  const submitError = ref('')

  const visibleDrawer = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const headerLabel = computed(() => {
    if (props.mode === 'edit') return 'Edit Plan'
    const labels = { pro: 'Upgrade to Pro', hobby: 'Subscribe to Hobby' }
    return labels[props.plan] || `Upgrade to ${props.plan}`
  })

  const submitLabel = computed(() => (props.mode === 'edit' ? 'Update Plan' : 'Subscribe'))

  const isSubscribeDisabled = computed(() => {
    return (
      isSubmitting.value ||
      !checkoutSessionClientSecret.value ||
      !isPaymentFormReady.value ||
      !isAddressFormReady.value
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

  // Keep the URL `?plan=` query in sync with the drawer's target plan so a
  // reload preserves intent. The actual SO + Stripe secret are prepared by
  // the caller (BillsView / signup) via `useCheckoutSessionPreparer` BEFORE
  // the drawer opens — no internal fetch here.
  watch(
    () => props.visible,
    (visible) => {
      if (visible) setParam('plan', props.plan)
    },
    { immediate: true }
  )

  // When the caller re-prepares the session (e.g. switches plan and reopens
  // the drawer without unmounting), the new secret flows in through the prop.
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
    submitError.value = ''
    try {
      const paymentErrors = await paymentRef.value?.validate?.()
      if (paymentErrors && Object.keys(paymentErrors).length > 0) return

      const address = await addressRef.value?.saveAddress?.()
      if (!address) return

      const checkoutConfirmation = await paymentRef.value?.confirmCheckoutSession?.()
      if (checkoutConfirmation?.type !== 'success') return

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
          address: address.address,
          complement: address.complement
        }
      })
    } catch (err) {
      const detail =
        (Array.isArray(err?.message) ? err.message[0] : err?.message) || 'Unable to subscribe.'
      submitError.value = detail
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
