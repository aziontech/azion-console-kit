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
  import { useMetricsStore } from '@/stores/metrics'
  import { storeToRefs } from 'pinia'
  import PrimeSkeleton from 'primevue/skeleton'
  import PrimeTag from 'primevue/tag'
  import { computed } from 'vue'

  const props = defineProps({
    reportId: { type: String, required: true }
  })

  const { getCurrentReportsDataById } = storeToRefs(useMetricsStore())

  const report = computed(() => {
    return getCurrentReportsDataById.value(props.reportId)
  })

  const aggregationTypeLabel = computed(() => {
    const labels = {
      sum: 'Sum',
      avg: 'Average'
    }
    return labels[report.value.aggregationType]
  })

  const displayTag = computed(() => {
    return report.value.hasFeedbackTag && typeof Number(report.value.aggregationValue)
  })

  const displaySkeleton = computed(() => {
    return report.value.hasFeedbackTag && !typeof Number(report.value.aggregationValue)
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
    return tagProps(report.value)
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
      value: variationValue.toFixed(precision)
    }
  }
</script>
