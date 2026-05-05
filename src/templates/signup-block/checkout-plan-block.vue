<template>
  <div class="relative flex h-full flex-col overflow-hidden pt-6 w-[600px]">
    <div class="checkout-scroll-area flex flex-1 flex-col gap-6 px-8 overflow-y-auto">
      <PricingCalculationBlock
        ref="pricingCalculationRef"
        :plan="plan"
        @update:billing-cycle="handleBillingCycleChange"
        @update:checkout-session-client-secret="handleCheckoutSessionClientSecretChange"
      />

      <PaymentMethodBlock
        ref="paymentMethodRef"
        :stripeClientService="getStripeClientService"
        :checkoutSessionClientSecret="checkoutSessionClientSecret"
        @readiness-change="handlePaymentReadinessChange"
      />

      <AddressInformationBlock
        ref="addressInformationRef"
        @readiness-change="handleAddressReadinessChange"
      />
    </div>
    <div
      class="flex shrink-0 justify-end gap-3 border-t border-[var(--border-default)] bg-surface px-8 py-4"
    >
      <Button
        class="font-protomono flex items-center justify-center text-xs"
        :disabled="isSubmitting"
        outlined
        @click="handleBack"
        label="Back"
      />
      <Button
        severity="secondary"
        class="font-protomono flex items-center justify-center text-xs"
        :icon="showLoading ? 'pi pi-spin pi-spinner' : ''"
        :disabled="isSubscribeDisabled"
        @click="handleSubmit"
        label="Subscribe"
      />
    </div>
  </div>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import Button from '@aziontech/webkit/button'
  import AddressInformationBlock from './address-information-block.vue'
  import PaymentMethodBlock from './payment-method-block.vue'
  import PricingCalculationBlock from './pricing-calculation-block.vue'
  import { useToast } from '@aziontech/webkit/use-toast'
  import { useScrollToError } from '@/composables/useScrollToError'

  defineOptions({
    name: 'checkout-plan-block'
  })
  const emit = defineEmits(['onBack', 'onSubmit'])
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
    }
  })

  const pricingCalculationRef = ref(null)
  const paymentMethodRef = ref(null)
  const addressInformationRef = ref(null)
  const isSubmitting = ref(false)
  const showLoading = ref(false)
  const billingCycle = ref('yearly')
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
  }

  const handlePaymentReadinessChange = (isReady) => {
    isPaymentFormReady.value = Boolean(isReady)
  }

  const handleAddressReadinessChange = (isReady) => {
    isAddressFormReady.value = Boolean(isReady)
  }

  const couponCode = computed(() => {
    return pricingCalculationRef.value?.couponCode?.value || ''
  })

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
        couponCode: couponCode.value,
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
      const errorMessage = String(error?.message || error || '')
      const knownStripeErrorMap = {
        authentication_required: 'Authentication is required to complete this payment.',
        card_declined: 'Your card was declined. Please use a different payment method.',
        expired_card: 'Your card is expired. Please use a different card.',
        incorrect_cvc: 'The security code is incorrect. Please review your payment details.',
        processing_error: 'Payment processing failed. Please try again in a few moments.'
      }

      const mappedErrorMessage =
        Object.entries(knownStripeErrorMap).find(([code]) => errorMessage.includes(code))?.[1] ||
        errorMessage

      const options = {
        closable: true,
        severity: 'error',
        summary: 'Error',
        detail: mappedErrorMessage || 'Unable to confirm payment. Please try again.'
      }
      toast.add(options)
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
    billingCycle,
    couponCode
  })
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
