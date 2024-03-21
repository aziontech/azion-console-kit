<script setup>
  import PrimeButton from 'primevue/button'
  import advancedFilter from '@/templates/advanced-filter'
  import { storeToRefs } from 'pinia'
  import { useMetricsStore } from '@/stores/metrics'
  import { computed, ref, watch } from 'vue'
  import { MAP_SERVICE_OPERATION } from '@modules/real-time-metrics/constants'
  import { isRelevantField } from '../utils/convert-metrics-fields'

  const metricsStore = useMetricsStore()
  const {
    getDatasetAvailableFilters,
    infoAvailableFiltersCurrent,
    getIsLoadingFilters,
    dashboardCurrent,
    currentFilters
  } = storeToRefs(metricsStore)

  const { setTimeRange, filterDatasetUpdate, createAndFilter, loadCurrentReports, resetFilters } =
    metricsStore

  const props = defineProps({
    playgroundOpener: {
      type: Function,
      required: true
    }
  })
  const refAdvancedFilter = ref('')

  const disabledFilter = computed(() => {
    return getIsLoadingFilters.value
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
        description: info?.description,
        operator: operator.map((op) => ({
          value: op.value,
          type: op.type,
          props: {
            placeholder: info?.placeholder,
            services: MAP_SERVICE_OPERATION[`${value}${op.value}`] || []
          }
        }))
      }
    })
    sortFields(newOptions)
    return newOptions
  })

  const timeFilter = computed({
    get: () => {
      return currentFilters.value
    },
    set: ({ tsRange }) => {
      if (!tsRange?.meta) return

      setTimeRange({
        tsRangeBegin: tsRange.begin,
        tsRangeEnd: tsRange.end,
        meta: tsRange.meta
      })
    }
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

  const applyFilter = async (filter) => {
    filter?.forEach((item) => {
      const field = `${item.valueField}${item.operator}`
      const alias = `${item.operator}`
      if (item.operator === 'In') {
        filterDatasetUpdate({
          fieldName: field,
          fieldAlias: `${alias}`,
          in: item.value.map((domain) => ({
            sourceId: domain.value,
            sourceName: domain.label
          })),
          meta: {
            inputType: '[String]',
            fieldPrefix: `${alias}_`
          }
        })
        return
      }

      if (item.operator === 'Range') {
        createAndFilter({
          [field]: {
            begin: item.value.begin,
            end: item.value.end,
            meta: {
              inputType: item.type
            }
          }
        })
        return
      }

      createAndFilter({
        [field]: {
          value: item.value,
          meta: {
            inputType: item.type
          }
        }
      })
    })

    if (!filter.length) {
      resetFilters()
    }

    await loadCurrentReports()
  }

  watch(
    () => dashboardCurrent.value,
    async () => {
      refAdvancedFilter.value.clearDisplayFilter()
    }
  )
</script>

<template>
  <div class="flex w-full flex-column gap-4 md:gap-2 md:flex-row">
    <advancedFilter
      :disabled="disabledFilter"
      :fieldsInFilter="optionsFields"
      hashLess
      v-model:externalFilter="timeFilter"
      ref="refAdvancedFilter"
      @applyFilter="applyFilter"
    />
    <PrimeButton
      class="h-auto w-full md:max-w-fit"
      outlined
      icon-pos="right"
      icon="pi pi-external-link"
      label="Open in GraphQL Playground"
      @click="props.playgroundOpener()"
    />
  </div>
</template>
../../../modules/real-time-metrics/constants/services-operator-in
