<script setup>
  import PrimeButton from 'primevue/button'
  import AdvancedFilter from '@/templates/advanced-filter/advanced-filter-no-hash'
  import { computed, onMounted, ref } from 'vue'
  import IntervalFilterBlock from '@/views/RealTimeEvents/Blocks/interval-filter-block'
  import { eventsPlaygroundOpener } from '@/helpers'
  import SelectButton from 'primevue/selectbutton'
  import AzionQueryLanguage from './azion-query-language.vue'
  import PrimeTag from 'primevue/tag'

  const emit = defineEmits(['update:filterData', 'updatedFilter'])

  const props = defineProps({
    filterData: {
      type: Object,
      default: () => ({})
    },
    downloadCSV: {
      type: Function
    },
    fieldsInFilter: {
      type: Array,
      required: true
    },
    recordsFound: {
      type: String,
      required: true
    }
  })

  onMounted(() => {
    filter.value.isUserUsingGraphqlQuery = false
  })

  const filterMode = ref('Wizard')
  const options = ref(['Wizard', 'Advanced'])

  const filter = computed({
    get: () => {
      return props.filterData
    },
    set: (value) => {
      emit('update:filterData', value)
    }
  })

  const isFields = computed(() => {
    return props.fieldsInFilter?.length === 0
  })

  const filterSearch = () => {
    emit('updatedFilter')
  }

  const searchAdvancedFilter = (filters) => {
    filter.value.fields = filters
    emit('updatedFilter')
  }

  const totalRecordsFound = computed(() => {
    return `${props.recordsFound} records found`
  })
</script>

<template>
  <div class="flex flex-col gap-6 md:gap-4">
    <div class="flex flex-col gap-2 md:flex-row justify-between">
      <div class="w-full">
        <IntervalFilterBlock
          v-model:filterDate="filter.tsRange"
          @applyTSRange="filterSearch"
        />
      </div>
      <div class="flex justify-end w-full">
        <PrimeTag
          :value="totalRecordsFound"
          severity="info"
        />
      </div>
    </div>
    <SelectButton
      v-model="filterMode"
      :options="options"
      aria-labelledby="basic"
      class="w-fit"
    />
    <div class="flex w-full flex-column gap-6 md:gap-2 md:flex-row items-baseline">
      <AdvancedFilter
        v-model:filterAdvanced="filter.fields"
        :fieldsInFilter="props.fieldsInFilter"
        :disabled="isFields"
        @applyFilter="filterSearch"
        v-if="filterMode === 'Wizard'"
      />
      <AzionQueryLanguage
        :fieldsInFilter="props.fieldsInFilter"
        :searchAdvancedFilter="searchAdvancedFilter"
        :filterAdvanced="filter.fields"
        v-else
      />
      <div class="flex gap-2 align-items-center">
        <PrimeButton
          class="h-auto w-full md:max-w-fit p-datatable"
          outlined
          size="small"
          icon-pos="right"
          icon="pi pi-external-link"
          label="Open in GraphiQL Playground"
          @click="eventsPlaygroundOpener"
        />
        <PrimeButton
          outlined
          size="small"
          icon="pi pi-download"
          v-tooltip.bottom="{ value: 'Export to CSV', showDelay: 200 }"
          @click="downloadCSV"
        />
      </div>
    </div>
  </div>
</template>
