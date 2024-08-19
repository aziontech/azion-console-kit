<script setup>
  import PrimeButton from 'primevue/button'
  import AdvancedFilter from '@/templates/advanced-filter/advanced-filter-no-hash.vue'
  import { computed, ref } from 'vue'
  import IntervalFilterBlock from '@/views/RealTimeEvents/blocks/interval-filter-block.vue'
  import { useRouteFilterManager } from '@/helpers/hash-route'
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

  const { setFilterInHash } = useRouteFilterManager()

  const filter = computed({
    get: () => {
      return props.filterData
    },
    set: (value) => {
      emit('update:filterData', value)
    }
  })

  const listFields = ref([
    {
      label: 'Status',
      value: 'status',
      mostRelevant: 1,
      description: 'HTTP status code of the request.',
      operator: [
        { value: 'Eq', type: 'Int', props: { placeholder: 'Example: 200', services: [] } },
        { value: 'Lt', type: 'Int', props: { placeholder: 'Example: 200', services: [] } },
        { value: 'Lte', type: 'Int', props: { placeholder: 'Example: 200', services: [] } },
        { value: 'Gt', type: 'Int', props: { placeholder: 'Example: 200', services: [] } },
        { value: 'Gte', type: 'Int', props: { placeholder: 'Example: 200', services: [] } },
        { value: 'Ne', type: 'Int', props: { placeholder: 'Example: 200', services: [] } },
        { value: 'Range', type: 'IntRange', props: { placeholder: 'Example: 200', services: [] } }
      ]
    }
  ])

  const filterSearch = () => {
    setFilterInHash(filter.value)
    emit('updatedFilter')
  }
</script>

<template>
  <div class="flex flex-col gap-6 md:gap-4">
    <IntervalFilterBlock
      v-model:filterDate="filter.tsRange"
      @applyTSRange="filterSearch"
    />
    <div class="flex w-full flex-column gap-6 md:gap-2 md:flex-row">
      <AdvancedFilter
        v-model:filterAdvanced="filter.fields"
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
          icon="pi pi-download"
          v-tooltip.bottom="{ value: 'Export to CSV', showDelay: 200 }"
          @click="downloadCSV"
        />
      </div>
    </div>
  </div>
</template>
