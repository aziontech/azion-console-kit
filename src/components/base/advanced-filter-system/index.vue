<script setup>
  import { eventsPlaygroundOpener } from '@/helpers'
  import PrimeButton from 'primevue/button'
  import PrimeTag from 'primevue/tag'

  import DataTimeRange from '@/components/base/dataTimeRange'
  import DialogFilter from '@/components/base/advanced-filter-system/filterFields/temp/index.vue'
  import AzionQueryLanguage from '@/components/base/advanced-filter-system/filterAQL/azion-query-language.vue'
  import FilterTagsDisplay from '@/components/base/advanced-filter-system/filterTagsDisplay'


  import { computed } from 'vue'
  import { useAccountStore } from '@/stores/account'
  import { ref, onMounted, defineModel } from 'vue'

  defineOptions({ name: 'advanced-filter-system' })

  const emit = defineEmits(['updatedFilter'])

  const props = defineProps({
    downloadCSV: {
      type: Function
    },
    fieldsInFilter: {
      type: Array,
      required: true
    },
    recordsFound: {
      type: String
    }
  })

  const filterData = defineModel('filterData')

  const filterDataRange = ref({})

  const accountStore = useAccountStore()
  const userUTC = accountStore.accountUtcOffset

  const updatedTime = () => {
    const { tsRangeBegin, tsRangeEnd } = updatedTimeRange(
      filterDataRange.value.startDate,
      filterDataRange.value.endDate,
      userUTC
    )

    filterData.value.tsRange = {
      tsRangeBegin,
      tsRangeEnd
    }
  }

  const filterSearch = () => {
    updatedTime()
    emitUpdatedFilter()
  }

  const emitUpdatedFilter = () => {
    emit('updatedFilter')
  }

  const searchAdvancedFilter = (filters) => {
    filterData.value.fields = filters
    updatedTime()
    emitUpdatedFilter()
  }

  const totalRecordsFound = computed(() => {
    return `${props.recordsFound || 0} records found`
  })

  const removeFilter = (index) => {
    filterData.value.fields.splice(index, 1)
    filterSearch()
  }

  const updatedTimeRange = (begin, end, userUTC) => {
    const dateBegin = begin.resetUTC(userUTC).toBeholderFormat()
    const dateEnd = end.resetUTC(userUTC).toBeholderFormat()

    return {
      tsRangeBegin: dateBegin,
      tsRangeEnd: dateEnd
    }
  }

  onMounted(() => {
    filterDataRange.value = {
      startDate: new Date(filterData.value.tsRange.tsRangeBegin),
      endDate: new Date(filterData.value.tsRange.tsRangeEnd),
      label: filterData.value.tsRange.label || ''
    }
  })
</script>

<template>
  <div class="flex flex-col gap-6 md:gap-4">
    <div class="flex flex-col gap-2 md:flex-row justify-between">
      <div class="w-full">
        <div class="flex">
          <DataTimeRange
            v-model="filterDataRange"
            @select="filterSearch"
          />
        </div>
      </div>
      <div class="flex justify-end align-items-center w-full gap-2">
        <PrimeTag
          class="p-2"
          v-if="recordsFound"
          :value="totalRecordsFound"
          severity="info"
        />
        <PrimeButton
          outlined
          size="small"
          icon-pos="right"
          icon="ai ai-graphql"
          v-tooltip.bottom="{ value: 'Open in GraphiQL Playground', showDelay: 200 }"
          @click="eventsPlaygroundOpener"
        />
        <PrimeButton
          outlined
          size="small"
          icon="pi pi-download"
          v-if="downloadCSV"
          v-tooltip.bottom="{ value: 'Export to CSV', showDelay: 200 }"
          @click="downloadCSV"
        />
      </div>
    </div>
    <div class="flex w-full flex-column gap-6 md:gap-2 md:flex-col items-center">
      <div class="flex w-full gap-2 items-center align-items-center">
        <DialogFilter
          v-model:filterAdvanced="filterData.fields"
          :fieldsInFilter="props.fieldsInFilter"
          @applyFilter="filterSearch"
        />
        <AzionQueryLanguage
          :fieldsInFilter="props.fieldsInFilter"
          :searchAdvancedFilter="searchAdvancedFilter"
          :filterAdvanced="filterData.fields"
        />
      </div>
      <div class="flex-1 w-full">
        <FilterTagsDisplay
          :filters="filterData.fields"
          :fieldsInFilter="props.fieldsInFilter"
          @removeFilter="removeFilter"
        />
      </div>

    </div>
  </div>
</template>
