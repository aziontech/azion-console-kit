<script setup>
  import CreatePaymentMethodBlock from '@templates/add-payment-method-block'
  import { refDebounced } from '@vueuse/core'
  import { onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'

  defineOptions({
    name: 'payment-method-drawer'
  })

  const emit = defineEmits(['onSuccess'])

  const props = defineProps({
    getStripeClientService: { type: Function, required: true }
  })

  const showCreatePaymentMethodDrawer = ref(false)
  const route = useRoute()
  const router = useRouter()
  const debouncedDrawerAnimate = 300

  const showCreateDrawer = refDebounced(showCreatePaymentMethodDrawer, debouncedDrawerAnimate)

  const closeCreateDrawer = () => {
    showCreatePaymentMethodDrawer.value = false
  }

  const openDrawer = () => {
    showCreatePaymentMethodDrawer.value = true
  }

  const handleCreatePaymentMethod = () => {
    emit('onSuccess')
    closeCreateDrawer()
  }

  const showPaymentMethod = () => {
    if (route.query.paymentSession || route.query.payment) {
      openDrawer()
      router.replace({ query: {} })
    }
  }

  onMounted(() => {
    showPaymentMethod()
  })

  defineExpose({
    openDrawer
  })
</script>

<template>
  <CreatePaymentMethodBlock
    :stripeClientService="props.getStripeClientService"
    v-model:visible="showCreatePaymentMethodDrawer"
    v-if="showCreateDrawer"
    @onSuccess="handleCreatePaymentMethod"
  />
</template>
