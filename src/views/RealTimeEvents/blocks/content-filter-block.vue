<script setup>
  import PrimeButton from 'primevue/button'
  import AdvancedFilter from '@/templates/advanced-filter'
  import { computed, ref } from 'vue'
  import IntervalFilterBlock from '@/views/RealTimeEvents/blocks/interval-filter-block.vue'

  const emit = defineEmits(['update:filterData', 'updatedFilter'])

  const props = defineProps({
    filterData: {
      type: Object,
      default: () => ({})
    },
    downloadCSV: {
      type: Function,
      required: true
    }
  })

  const advancedFilter = computed({
    get: () => {
      return props.filterData
    },
    set: (value) => {
      emit('update:filterData', value)
    }
  })

  const listFields = ref([
    {
      label: 'IP Address',
      value: 'ip_address',
      description: '',
      operator: [
        { value: 'Eq', type: 'String', props: { placeholder: 'Select IP Address' } },
        { value: 'Ne', type: 'String', props: { placeholder: 'Enter IP Address' } }
      ]
    }
  ])

  const filterSearch = (filter) => {
    emit('updatedFilter', filter)
  }
</script>

<template>
  <div class="flex flex-col gap-6 md:gap-4">
    <IntervalFilterBlock
      v-model:filterDate="advancedFilter.tsRange"
      @applyTSRange="filterSearch"
    />
    <div class="flex w-full flex-column gap-6 md:gap-2 md:flex-row">
      <AdvancedFilter
        hashLess
        v-model:externalFilter="advancedFilter.tsRange"
        v-model:filterAdvanced="advancedFilter.fields"
        :fieldsInFilter="listFields"
        @applyFilter="filterSearch"
      />
      <div class="flex gap-2 align-items-center">
        <PrimeButton
          class="h-auto w-full md:max-w-fit"
          outlined
          icon-pos="right"
          icon="pi pi-external-link"
          label="Open in GraphQL Playground"
        />
        <PrimeButton
          outlined
          class="p-4"
          icon="pi pi-download"
          v-tooltip.bottom="{ value: 'Export to CSV', showDelay: 200 }"
          @click="downloadCSV"
        />
      </div>
    </div>
  </div>
</template>
