<template>
  <div class="flex items-center gap-2">
    <h2 class="text-2xl font-bold text-color">
      {{ data.value }}
      <span class="text-sm font-normal">{{ data.unit }}</span>
    </h2>
    <PrimeTag
      :class="variationProps?.class"
      :value="variationProps.value"
      :icon="variationProps?.icon"
      :severity="variationProps.severity"
    />
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import PrimeTag from 'primevue/tag'

  const props = defineProps({
    data: {
      type: Object,
      required: true
    }
  })

  const getTagPropsByVariation = (variation) => {
    const variations = {
      'positive-regular': {
        severity: 'success',
        icon: 'pi pi-arrow-up-right'
      },
      'negative-regular': {
        severity: 'danger',
        icon: 'pi pi-arrow-down-left'
      },
      'positive-inverse': {
        severity: 'danger',
        icon: 'pi pi-arrow-up-right'
      },
      'negative-inverse': {
        severity: 'success',
        icon: 'pi pi-arrow-down-left'
      },
      'not-compare': {
        severity: 'warning',
        icon: 'pi pi-exclamation-triangle'
      },
      'no-variation': {
        severity: 'info'
      }
    }
    return variations[variation]
  }

  const variationProps = computed(() => {
    return tagProps(props.data)
  })

  const tagProps = (data) => {
    const { variationValue, variationType } = data
    const upperLimit = 0.01
    const lowerLimit = -0.01
    const precision = 2

    if (variationValue > lowerLimit && variationValue < upperLimit) {
      return {
        ...getTagPropsByVariation('not-compare'),
        value: "Can't compare"
      }
    }

    const variationState = variationValue > upperLimit ? 'positive' : 'negative'

    return {
      ...getTagPropsByVariation(`${variationState}-${variationType}`),
      value: `${variationValue.toFixed(precision)}%`
    }
  }
</script>
