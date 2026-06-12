<template>
  <div class="w-full max-w-5xl mx-auto bg-surface rounded border surface-border">
    <div class="flex flex-col-reverse lg:flex-row">
      <CheckoutPlanBlock
        ref="planBlockRef"
        :plan="plan"
        :checkoutSessionClientSecret="checkoutSessionClientSecret"
        :draftServiceOrderId="draftServiceOrderId"
        :getStripeClientService="getStripeClientService"
        @onBack="emit('onBack')"
        @onSubmit="handleSubmit"
        @payment-element-ready="emit('payment-element-ready')"
        @stale-session="emit('stale-session', $event)"
        @checkout-session-prepared="emit('checkout-session-prepared', $event)"
      />
      <CheckoutFeaturesBlock :plan="plan" />
    </div>
  </div>
</template>

<script setup>
  import CheckoutPlanBlock from '@/templates/checkout-block/checkout-plan-block.vue'
  import CheckoutFeaturesBlock from '@/templates/checkout-block/checkout-features-block.vue'
  import { getStripeClientService } from '@/services/billing-services'
  import { ref } from 'vue'

  defineOptions({
    name: 'checkout-payment-block'
  })

  defineProps({
    plan: {
      type: String,
      required: true,
      validator: (value) => ['hobby', 'pro'].includes(value),
      default: 'hobby'
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

  const emit = defineEmits([
    'onSuccess',
    'onError',
    'onBack',
    'onSubmit',
    'payment-element-ready',
    'stale-session',
    'checkout-session-prepared'
  ])

  const isSubmitting = ref(false)
  const showLoading = ref(false)

  const handleSubmit = async (checkoutData) => {
    if (isSubmitting.value) {
      return
    }

    isSubmitting.value = true
    showLoading.value = true

    try {
      emit('onSuccess', checkoutData)
    } catch (error) {
      emit('onError', error)
    } finally {
      isSubmitting.value = false
      showLoading.value = false
    }
  }

  defineExpose({
    handleSubmit,
    isSubmitting
  })
</script>
