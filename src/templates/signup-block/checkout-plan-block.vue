<template>
  <div class="relative flex h-full flex-col overflow-hidden pt-6 w-[600px]">
    <div class="checkout-scroll-area flex flex-1 flex-col gap-6 px-8 overflow-y-auto">
      <PricingCalculationBlock
        ref="pricingCalculationRef"
        :plan="plan"
      />

      <PaymentMethodBlock ref="paymentMethodRef" />

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
  import { computed, ref } from 'vue'
  import Button from '@aziontech/webkit/button'
  import AddressInformationBlock from './address-information-block.vue'
  import PaymentMethodBlock from './payment-method-block.vue'
  import PricingCalculationBlock from './pricing-calculation-block.vue'

  defineOptions({
    name: 'checkout-plan-block'
  })
  const emit = defineEmits(['onBack', 'onSubmit'])

  defineProps({
    plan: {
      type: String,
      required: true,
      validator: (value) => ['pro', 'scale'].includes(value)
    }
  })

  const pricingCalculationRef = ref(null)
  const paymentMethodRef = ref(null)
  const addressInformationRef = ref(null)
  const isSubmitting = ref(false)
  const showLoading = ref(false)

  const paymentMethod = computed(() => ({
    cardHolderName: paymentMethodRef.value?.paymentMethod?.value?.cardHolderName || '',
    cardNumber: paymentMethodRef.value?.paymentMethod?.value?.cardNumber || '',
    expirationDate: paymentMethodRef.value?.paymentMethod?.value?.expirationDate || '',
    securityCode: paymentMethodRef.value?.paymentMethod?.value?.securityCode || ''
  }))

  const billingCycle = computed(() => {
    return pricingCalculationRef.value?.billingCycle?.value || 'yearly'
  })

  const addressInformation = computed(() => ({
    country: addressInformationRef.value?.addressInformation?.value?.country || '',
    postalCode: addressInformationRef.value?.addressInformation?.value?.postalCode || '',
    region: addressInformationRef.value?.addressInformation?.value?.region || '',
    city: addressInformationRef.value?.addressInformation?.value?.city || '',
    address: addressInformationRef.value?.addressInformation?.value?.address || '',
    complement: addressInformationRef.value?.addressInformation?.value?.complement || ''
  }))

  const couponCode = computed(() => {
    return pricingCalculationRef.value?.couponCode?.value || ''
  })

  const handleBack = () => {
    emit('onBack')
  }

  const handleSubmit = () => {
    emit('onSubmit', paymentMethod.value)
  }

  defineExpose({
    billingCycle,
    couponCode,
    paymentMethod,
    addressInformation
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
