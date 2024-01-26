<template>
  <div class="flex gap-2">
    <PrimeTag
      icon="pi pi-calculator"
      :value="aggregationTypeLabel"
    />
    <PrimeTag
      :class="tagProps?.class"
      v-if="displayTag && variationValue"
      :value="variationValue"
      :icon="tagProps?.icon"
      :severity="tagProps?.severity"
    />
    <PrimeSkeleton
      class="w-10 h-[26px] rounded-md"
      v-if="displayTag && !variationValue"
    />
  </div>
</template>

<script setup>
  import PrimeSkeleton from 'primevue/skeleton'
  import PrimeTag from 'primevue/tag'
  import { computed } from 'vue'

  const props = defineProps({
    aggregationType: { type: String, required: true },
    displayTag: Boolean,
    variationType: { type: String, required: true },
    variationValue: { type: String, required: true }
  })

  const aggregationTypeLabel = computed(() => {
    const labels = {
      sum: 'Sum',
      avg: 'Average'
    }

    return labels[props.aggregationType]
  })

  const tagProps = computed(() => {
    const { variationType } = props

    switch (variationType) {
      case 'positive':
        return {
          severity: 'success',
          icon: 'pi pi-arrow-circle-up'
        }
      case 'negative':
        return {
          severity: 'danger',
          icon: 'pi pi-arrow-circle-down'
        }
      case 'positive-inverse':
        return {
          severity: 'danger',
          icon: 'pi pi-arrow-circle-up'
        }
      case 'negative-inverse':
        return {
          severity: 'success',
          icon: 'pi pi-arrow-circle-down'
        }
      default:
        return null
    }
  })
</script>
