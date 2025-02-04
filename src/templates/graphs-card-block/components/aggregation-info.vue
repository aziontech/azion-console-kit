<template>
  <div class="flex gap-2">
    <PrimeTag
      icon="pi pi-calculator"
      :value="aggregationTypeLabel"
      severity="info"
    />
    <PrimeTag
      v-if="displayTag"
      :class="variationProps?.class"
      :value="variationProps.value"
      :icon="variationProps?.icon"
      :severity="variationProps.severity"
    />
    <PrimeSkeleton
      class="w-10 h-[26px] rounded-md"
      v-if="displaySkeleton"
    />
  </div>
</template>

<script setup>
  import PrimeSkeleton from 'primevue/skeleton'
  import PrimeTag from 'primevue/tag'
  import { computed } from 'vue'

  const props = defineProps({
    report: { type: Object, required: true }
  })

  const aggregationTypeLabel = computed(() => {
    const labels = {
      sum: 'Sum',
      avg: 'Average'
    }
    return labels[props.report.aggregationType] || 'Sum'
  })

  const displayTag = computed(() => {
    if (props.report.type === 'big-numbers' || props.report.isDoubleChart) {
      return false
    }
    return props.report.hasFeedbackTag && typeof Number(props.report.aggregationValue)
  })

  const displaySkeleton = computed(() => {
    return props.report.hasFeedbackTag && !typeof Number(props.report.aggregationValue)
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
    return tagProps(props.report)
  })

  const tagProps = (report) => {
    const { variationValue, variationType } = report
    const upperLimit = 0.01
    const lowerLimit = -0.01
    const precision = 2

    if (variationValue > lowerLimit && variationValue < upperLimit) {
      return {
        ...getTagPropsByVariation('not-compare'),
        value: "Can't compare"
      }
    }

    const variationSatate = variationValue > upperLimit ? 'positive' : 'negative'

    return {
      ...getTagPropsByVariation(`${variationSatate}-${variationType}`),
      value: `${variationValue.toFixed(precision)}%`
    }
  }
</script>
