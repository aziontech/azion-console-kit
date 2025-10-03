<script setup>
  import DataTimeRange from '@/components/base/dataTimeRange'
  import DialogFilter from '@/components/base/advanced-filter-system/filterFields/temp/index.vue'
  import AzionQueryLanguage from '@/components/base/advanced-filter-system/filterAQL/azion-query-language.vue'
  import FilterTagsDisplay from '@/components/base/advanced-filter-system/filterTagsDisplay'
  import PrimeButton from 'primevue/button'

  import { useAccountStore } from '@/stores/account'
  import { ref, onMounted, defineModel } from 'vue'

  defineOptions({ name: 'advanced-filter-system' })

  const emit = defineEmits(['updatedFilter'])

  const props = defineProps({
    fieldsInFilter: {
      type: Array,
      required: true
    },
    filterDateRangeMaxDays: {
      type: Number
    }
  })

  const filterData = defineModel('filterData')

  const dataTimeRangeRef = ref(null)
  const filterDataRange = ref({})
  const isPendingChange = ref(true)
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

  const updateDateRange = () => {
    dataTimeRangeRef.value.updateDateRange()
    filterSearch()
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
    <div
      class="flex w-full flex-column md:flex-col items-center"
      :class="{ 'gap-6 md:gap-4': filterData.fields.length }"
    >
      <div class="flex w-full gap-2 items-center align-items-center md:flex-row flex-col">
        <div class="flex-1 flex gap-2 items-center max-md:w-full">
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
        <DataTimeRange
          ref="dataTimeRangeRef"
          class="max-md:w-full"
          v-model="filterDataRange"
          :isPendingChange="isPendingChange"
          :maxDays="props.filterDateRangeMaxDays"
          @select="filterSearch"
        />

        <PrimeButton
          v-if="isPendingChange"
          icon="pi pi-arrow-right"
          outlined
          size="small"
          label="Update"
          @click="updateDateRange"
        />

        <PrimeButton
          v-else
          icon="pi pi-refresh"
          outlined
          size="small"
          label="Refresh"
          @click="filterSearch"
        />
      </div>
      <div class="flex flex-1 w-full">
        <FilterTagsDisplay
          :filters="filterData.fields"
          :fieldsInFilter="props.fieldsInFilter"
          @removeFilter="removeFilter"
        />
      </div>
    </div>
  </div>
</template>
