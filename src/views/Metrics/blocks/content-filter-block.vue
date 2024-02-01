<script setup>
  import PrimeButton from 'primevue/button'
  import advancedFilter from '@/templates/advanced-filter'
  import { storeToRefs } from 'pinia'
  import { useMetricsStore } from '@/stores/metrics'
  import { computed } from 'vue'
  import MAP_SERVICE_OPERATION from '../constants/services-operator-in'
  import { isRelevantField } from '../utils/convert-metrics-fields'

  const metricsStore = useMetricsStore()
  const { getDatasetAvailableFilters, infoAvailableFiltersCurrent, dashboardCurrent } =
    storeToRefs(metricsStore)

  const props = defineProps({
    playgroundOpener: {
      type: Function,
      required: true
    }
  })

  const disabledFilter = computed(() => {
    return (
      !getDatasetAvailableFilters.value.length ||
      !Object.keys(infoAvailableFiltersCurrent.value).length
    )
  })

  const optionsFields = computed(() => {
    const infoOptions = infoAvailableFiltersCurrent.value
    const options = getDatasetAvailableFilters.value
    if (!options.length) return []
    if (!infoOptions) return []
    const { dataset } = dashboardCurrent.value
    const newOptions = options.map(({ label, operator, value }) => {
      const info = infoOptions[dataset][value]
      const mostRelevant = isRelevantField(label, dataset)
      return {
        label,
        value,
        mostRelevant,
        description: info.description,
        operator: operator.map((op) => ({
          value: op.value,
          type: op.type,
          props: {
            placeholder: info.placeholder,
            services: MAP_SERVICE_OPERATION[value + op.value] || []
          }
        }))
      }
    })
    sortFields(newOptions)
    return newOptions
  })

  const sortFields = (fields) => {
    const notRelevant = -1
    fields.sort((fieldA, fieldB) => {
      if (fieldA.mostRelevant === notRelevant && fieldB.mostRelevant !== notRelevant) {
        return 1
      }

      if (fieldA.mostRelevant !== notRelevant && fieldB.mostRelevant === notRelevant) {
        return -1
      }

      if (fieldA.mostRelevant !== fieldB.mostRelevant) {
        return fieldA.mostRelevant - fieldB.mostRelevant
      }

      return fieldA.label.localeCompare(fieldB.label)
    })
  }
</script>
<template>
  <div class="flex w-full items-center flex-column gap-4 md:gap-2 md:flex-row">
    <advancedFilter
      :disabled="disabledFilter"
      :fieldsInFilter="optionsFields"
      @applyFilter="console.log"
    />
    <PrimeButton
      class="h-8 w-full md:max-w-fit"
      outlined
      icon-pos="right"
      icon="pi pi-external-link"
      label="Open in GraphQL Playground"
      @click="props.playgroundOpener()"
      :disabled="true"
    />
  </div>
</template>
