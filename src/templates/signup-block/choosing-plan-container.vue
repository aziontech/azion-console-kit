<template>
  <div class="w-full mx-auto bg-surface h-[800px] rounded border surface-border">
    <div class="flex h-full min-h-0 overflow-hidden md:flex-row">
      <CheckoutPlanBlock
        ref="planBlockRef"
        :plan="plan"
        @onBack="emit('onBack')"
      />
      <CheckoutFeaturesBlock :plan="plan" />
    </div>
  </div>
</template>

<script setup>
  import CheckoutPlanBlock from './checkout-plan-block.vue'
  import CheckoutFeaturesBlock from './checkout-features-block.vue'
  import { ref } from 'vue'

  defineOptions({
    name: 'checkout-payment-block'
  })

  defineProps({
    plan: {
      type: String,
      required: true,
      validator: (value) => ['pro', 'scale'].includes(value),
      default: 'pro'
    },
    getStripeClientService: {
      type: Function,
      required: true
    }
  })

  const emit = defineEmits(['onSuccess', 'onError', 'onBack'])

  const planBlockRef = ref(null)
  const isSubmitting = ref(false)
  const showLoading = ref(false)

  const handleSubmit = async () => {
    isSubmitting.value = true
    showLoading.value = true

    try {
      // TODO: Implement payment submission
      emit('onSuccess')
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
