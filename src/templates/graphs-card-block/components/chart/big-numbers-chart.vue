<template>
  <div class="flex justify-between items-center gap-2 mt-7 flex-wrap">
    <div class="flex items-center gap-3">
      <h2 class="text-2xl font-bold text-color">
        {{ resultChart[0].value }}
        <span class="text-sm font-normal">{{ resultChart[0].unit }}</span>
      </h2>
      <PrimeTag
        :class="variationProps?.class"
        :value="variationProps.value"
        :icon="variationProps?.icon"
        :severity="variationProps.severity"
      />
    </div>
    <AggregationInfo :report="chartData" />
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import PrimeTag from 'primevue/tag'
  import AggregationInfo from '../aggregation-info.vue'

  const props = defineProps({
    resultChart: {
      type: Array,
      default: () => []
    },
    variationValue: {
      type: Array
    },
    chartData: {
      type: Object
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
    return tagProps(props.resultChart[0])
  })

  const tagProps = (data) => {
    const { variationType } = data
    const upperLimit = 0.01
    const lowerLimit = -0.01
    const precision = 2

    if (props.variationValue > lowerLimit && props.variationValue < upperLimit) {
      return {
        ...getTagPropsByVariation('not-compare'),
        value: "Can't compare"
      }
    }

    const variationState = props.variationValue > upperLimit ? 'positive' : 'negative'

    return {
      ...getTagPropsByVariation(`${variationState}-${variationType}`),
      value: `${props.variationValue.toFixed(precision)}%`
    }
  }
</script>
