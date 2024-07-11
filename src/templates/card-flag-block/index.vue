<template>
  <component :is="cardLogoComponent" />
</template>

<script setup>
  import { computed, defineAsyncComponent } from 'vue'

  defineOptions({ name: 'card-flag-block' })

  const props = defineProps({
    cardFlag: {
      type: String,
      validator: (value) =>
        ['visa', 'mastercard', 'jcb', 'discover', 'diners', 'amex'].includes(value),
      required: true
    }
  })

  const LIST_CARD_ICONS = {
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

  const cardLogoComponent = computed(() => LIST_CARD_ICONS[props.cardFlag])
</script>
