<template>
  <div class="flex gap-2">
    <PrimeTag
      icon="pi pi-calculator"
      :value="aggregationType"
      :class="defaultTagClass"
    />
    <PrimeTag
      :class="tagProps?.class"
      v-if="displayTag && variationValue"
      :value="variationValue"
      :icon="tagProps?.icon"
      :severity="tagProps?.severity"
    />
    <PrimeSkeleton
      v-if="displayTag && !variationValue"
      height="26px"
      width="2.5rem"
      borderRadius="0.375rem"
    />
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import PrimeTag from 'primevue/tag'
  import PrimeSkeleton from 'primevue/skeleton'

  const props = defineProps({
    aggregationType: { type: String, required: true },
    displayTag: Boolean,
    variationType: { type: String, required: true },
    variationValue: { type: String, required: true }
  })

  const defaultTagClass = 'bg-[#cccccc] text-[#111111]'

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
        return {
          class: defaultTagClass
        }
    }
  })
</script>
