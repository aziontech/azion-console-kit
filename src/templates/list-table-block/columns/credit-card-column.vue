<template>
  <div class="flex items-center gap-3">
    <component :is="cardLogoComponent" />
    {{ cardNumber }}
    <PrimeTag
      severity="info"
      :value="status"
      v-if="status"
    />
  </div>
</template>

<script setup>
  import PrimeTag from 'primevue/tag'
  import { defineAsyncComponent, computed } from 'vue'

  const props = defineProps({
    cardNumber: {
      type: String,
      required: true
    },
    cardBrand: {
      type: String,
      required: true
    },
    status: {
      type: String,
      required: false
    }
  })

  const cardComponents = {
    visa: defineAsyncComponent(() => import('@/assets/svg/credit-card-logos/visa-card.vue')),
    mastercard: defineAsyncComponent(() =>
      import('@/assets/svg/credit-card-logos/mastercard-card.vue')
    ),
    jcb: defineAsyncComponent(() => import('@/assets/svg/credit-card-logos/jcb-card.vue')),
    discover: defineAsyncComponent(() =>
      import('@/assets/svg/credit-card-logos/discover-card.vue')
    ),
    diners: defineAsyncComponent(() => import('@/assets/svg/credit-card-logos/diners-card.vue')),
    amex: defineAsyncComponent(() => import('@/assets/svg/credit-card-logos/amex-card.vue'))
  }

  const cardLogoComponent = computed(() => cardComponents[props.cardBrand.toLowerCase()])
</script>
