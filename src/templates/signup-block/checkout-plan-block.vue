<template>
  <div class="relative flex h-full flex-col overflow-hidden pt-6 w-[600px]">
    <div class="checkout-scroll-area flex flex-1 flex-col gap-6 px-8 overflow-y-auto">
      <PricingCalculationBlock
        ref="pricingCalculationRef"
        :plan="plan"
        @update:billing-cycle="handleBillingCycleChange"
      />

      <PaymentMethodBlock
        ref="paymentMethodRef"
        :stripeClientService="getStripeClientService"
      />

      <AddressInformationBlock ref="addressInformationRef" />
    </div>
    <div
      class="flex shrink-0 justify-end gap-3 border-t border-[var(--border-default)] bg-surface px-8 py-4"
    >
      <Button
        class="font-protomono flex items-center justify-center text-xs"
        :disabled="isSubmitting"
        outlined
        @click="handleBack"
        label="Cancel"
      />
      <Button
        severity="secondary"
        class="font-protomono flex items-center justify-center text-xs"
        :icon="showLoading ? 'pi pi-spin pi-spinner' : ''"
        :disabled="isSubmitting"
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
  import { useServiceOrders } from '@/composables/useServiceOrders'
  import { usePlansList, getPlanPricingId } from '@/composables/usePlansService'
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
    }
  })

  const { data: plansData } = usePlansList()
  const { serviceOrder, updatePlanPricing } = useServiceOrders()

  const pricingCalculationRef = ref(null)
  const paymentMethodRef = ref(null)
  const addressInformationRef = ref(null)
  const isSubmitting = ref(false)
  const showLoading = ref(false)
  const billingCycle = ref('yearly')

  const handleBillingCycleChange = (value) => {
    billingCycle.value = value
  }

  const couponCode = computed(() => {
    return pricingCalculationRef.value?.couponCode?.value || ''
  })

  const handleBack = () => {
    emit('onBack')
  }

  const handleSubmit = async () => {
    isSubmitting.value = true
    showLoading.value = true

    try {
      // 1. Validate payment method
      const paymentErrors = await paymentMethodRef.value?.validate()
      if (paymentErrors && Object.keys(paymentErrors).length > 0) {
        scrollToError(paymentErrors)
        return
      }

      // 2. Create Stripe token
      const token = await paymentMethodRef.value?.createToken()
      if (!token) {
        throw new Error('Failed to create payment token')
      }

      // 3. Save/validate address
      const address = await addressInformationRef.value?.saveAddress()
      if (!address) {
        return
      }

      // 4. Emit checkout data
      const checkoutData = {
        stripeToken: token.id,
        cardHolderName: token.card.name,
        cardBrand: token.card.brand,
        cardLast4: token.card.last4,
        cardExpirationMonth: token.card.exp_month,
        cardExpirationYear: token.card.exp_year,
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
      const options = {
        closable: true,
        severity: 'error',
        summary: 'Error',
        detail: error.message || error
      }
      toast.add(options)
    } finally {
      isSubmitting.value = false
      showLoading.value = false
    }
  }

  watch(billingCycle, async (newBillingCycle) => {
    if (!serviceOrder.value?.serviceOrderId) return

    const planPricingId = getPlanPricingId(plansData.value, props.plan, newBillingCycle)

    if (planPricingId) {
      await updatePlanPricing(planPricingId)
    }
  })

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
