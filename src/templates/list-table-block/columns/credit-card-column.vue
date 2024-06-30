<template>
  <div class="flex items-center gap-3">
    <component :is="cardLogoComponent" />
    {{ content }}
    <PrimeTag
      severity="info"
      value="Default"
      v-if="defaultCard"
    />
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import PrimeTag from 'primevue/tag'
  import VisaLogo from '@/assets/svg/credit-card-logos/visa-card.vue'
  import MastercardLogo from '@/assets/svg/credit-card-logos/mastercard-card.vue'
  import JCBLogo from '@/assets/svg/credit-card-logos/jcb-card.vue'
  import DiscoverLogo from '@/assets/svg/credit-card-logos/discover-card.vue'
  import DinersLogo from '@/assets/svg/credit-card-logos/diners-card.vue'
  import AmexLogo from '@/assets/svg/credit-card-logos/amex-card.vue'

  const props = defineProps({
    content: {
      type: String,
      required: true
    },
    card: {
      type: String,
      required: true
    },
    defaultCard: {
      type: Boolean,
      required: false,
      default: false
    }
  })

  const cardComponents = {
    visa: VisaLogo,
    mastercard: MastercardLogo,
    jcb: JCBLogo,
    discover: DiscoverLogo,
    diners: DinersLogo,
    amex: AmexLogo
  }

  const cardLogoComponent = computed(() => cardComponents[props.card.toLowerCase()])
</script>
