<template>
  <div class="relative flex flex-col pt-6 w-full lg:w-[600px]">
    <div class="flex flex-col gap-6 px-4 lg:px-8">
      <PricingCalculationBlock
        ref="pricingCalculationRef"
        :plan="plan"
        :draftServiceOrderId="draftServiceOrderId"
        context="signup"
        @update:billing-cycle="handleBillingCycleChange"
        @update:checkout-session-client-secret="handleCheckoutSessionClientSecretChange"
      />

      <PaymentMethodBlock
        ref="paymentMethodRef"
        :stripeClientService="getStripeClientService"
        :checkoutSessionClientSecret="checkoutSessionClientSecret"
        @readiness-change="handlePaymentReadinessChange"
        @element-ready="emit('payment-element-ready')"
        @stale-session="handleStaleCheckoutSession"
      />

      <AddressInformationBlock
        ref="addressInformationRef"
        @readiness-change="handleAddressReadinessChange"
      />
    </div>
    <CheckoutActionFooter
      :submitting="isSubmitting"
      :disabled="isSubscribeDisabled"
      :loading="showLoading"
      @back="handleBack"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import AddressInformationBlock from './address-information-block.vue'
  import PaymentMethodBlock from './payment-method-block.vue'
  import PricingCalculationBlock from './pricing-calculation-block.vue'
  import CheckoutActionFooter from '@/templates/checkout-block/checkout-action-footer.vue'
  import { mapStripeError } from '@/templates/checkout-block/helpers/stripe-error-mapper.js'
  import { useToast } from '@aziontech/webkit/use-toast'
  import { useScrollToError } from '@/composables/useScrollToError'

  defineOptions({
    name: 'checkout-plan-block'
  })
  const emit = defineEmits([
    'onBack',
    'onSubmit',
    'payment-element-ready',
    'stale-session',
    'checkout-session-prepared'
  ])
  const toast = useToast()
  const { scrollToError } = useScrollToError()

  const props = defineProps({
    plan: {
      type: String,
      required: true,
      validator: (value) => value === 'pro'
    },
    getStripeClientService: {
      type: Function,
      required: true
    },
    checkoutSessionClientSecret: {
      type: String,
      default: ''
    },
    draftServiceOrderId: {
      type: [String, Number],
      default: null
    }
  })

  const pricingCalculationRef = ref(null)
  const paymentMethodRef = ref(null)
  const addressInformationRef = ref(null)
  const isSubmitting = ref(false)
  const showLoading = ref(false)
  const billingCycle = ref('monthly')
  const checkoutSessionClientSecret = ref(props.checkoutSessionClientSecret)
  const isPaymentFormReady = ref(false)
  const isAddressFormReady = ref(false)

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
    if (!value) return
    emit('checkout-session-prepared', {
      clientSecret: value,
      billingCycle: billingCycle.value
    })
  }

  const handlePaymentReadinessChange = (isReady) => {
    isPaymentFormReady.value = Boolean(isReady)
  }

  const handleAddressReadinessChange = (isReady) => {
    isAddressFormReady.value = Boolean(isReady)
  }

  const handleStaleCheckoutSession = (payload = {}) => {
    isPaymentFormReady.value = false
    emit('stale-session', {
      ...payload,
      plan: props.plan,
      billingCycle: billingCycle.value
    })
  }

  const handleBack = () => {
    emit('onBack')
  }

  const handleSubmit = async () => {
    if (isSubmitting.value) {
      return
    }

    isSubmitting.value = true
    showLoading.value = true

    try {
      // 1. Validate payment method
      const paymentErrors = await paymentMethodRef.value?.validate()
      if (paymentErrors && Object.keys(paymentErrors).length > 0) {
        scrollToError(paymentErrors)
        return
      }

      // 2. Save/validate address
      const address = await addressInformationRef.value?.saveAddress()
      if (!address) {
        return
      }

      if (!checkoutSessionClientSecret.value) {
        throw new Error('Payment session is missing. Please try again.')
      }

      // 3. Confirm checkout session
      const checkoutConfirmation = await paymentMethodRef.value?.confirmCheckoutSession()

      if (checkoutConfirmation?.type !== 'success') {
        throw new Error('Payment could not be completed. Please try again.')
      }

      // 4. Emit checkout data
      const checkoutData = {
        paymentIntentId: checkoutConfirmation?.paymentIntent?.id,
        paymentStatus: checkoutConfirmation?.paymentIntent?.status,
        checkoutSessionId: checkoutConfirmation?.session?.id,
        checkoutSessionStatus: checkoutConfirmation?.session?.status,
        checkoutConfirmationStatus: checkoutConfirmation?.status,
        billingCycle: billingCycle.value,
        address: {
          postalCode: address.postalCode,
          country: addressInformationRef.value?.getCountry(Number(address.country)) || '',
          countryId: address.country,
          region: address.region,
          city: address.city,
          address: address.address,
          complement: address.complement
        }
      }

      emit('onSubmit', checkoutData)
    } catch (error) {
      const detail = mapStripeError(error?.message || error)
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Error',
        detail
      })
    } finally {
      isSubmitting.value = false
      showLoading.value = false
    }
  }

  watch(
    () => props.checkoutSessionClientSecret,
    (newCheckoutSessionClientSecret) => {
      checkoutSessionClientSecret.value = newCheckoutSessionClientSecret
    }
  )

  defineExpose({
    billingCycle
  })
</script>
