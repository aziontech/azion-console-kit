<template>
  <div class="flex items-center gap-3">
    <cardFlagBlock
      v-if="props.cardBrand"
      :cardFlag="props.cardBrand"
    />
    {{ props.cardNumber || '-' }}
    <PrimeTag
      severity="info"
      :value="props.status"
      v-if="props.status"
    />
  </div>
</template>

<script setup>
  import PrimeTag from 'primevue/tag'
  import cardFlagBlock from '@templates/card-flag-block'

  const props = defineProps({
    cardNumber: {
      type: String
    },
    cardBrand: {
      type: String
    },
    status: {
      type: String
    }
  })
</script>
