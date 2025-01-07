<script setup>
  import PrimeButton from 'primevue/button'
  import AdvancedFilter from '@/templates/advanced-filter/advanced-filter-no-hash'
  import { computed, ref, onMounted } from 'vue'
  import { storeToRefs } from 'pinia'
  import IntervalFilterBlock from '@/views/RealTimeEvents/Blocks/interval-filter-block'
  import { eventsPlaygroundOpener } from '@/helpers'
  import CodeEditor from './components/code-editor.vue'
  import Accordion from 'primevue/accordion'
  import AccordionTab from 'primevue/accordiontab'
  import { useGraphQLStore } from '@/stores/graphql-query'

  const emit = defineEmits(['update:filterData', 'updatedFilter'])

  const graphqlStore = useGraphQLStore()
  const { getLastQuery } = storeToRefs(graphqlStore)

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
    }
  })

  const code = ref('')

  onMounted(() => {
    filter.value.isUserUsingGraphqlQuery = false
  })

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
    filter.value.isUserUsingGraphqlQuery = false
    filter.value.graphqlQuery = ''
    emit('updatedFilter')
  }

  const filterSearchUserQuery = () => {
    filter.value.isUserUsingGraphqlQuery = true
    filter.value.graphqlQuery = code.value
    emit('updatedFilter')
  }

  const replaceVariablesInQuery = (query, variables) => {
    if (!query && !variables) return
    let updatedQuery = query

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\$${key}`, 'g')
      const formattedValue = Array.isArray(value)
        ? // eslint-disable-next-line id-length
          `[${value.map((v) => (typeof v === 'string' ? `"${v}"` : v)).join(', ')}]`
        : typeof value === 'string'
        ? `"${value}"`
        : value
      updatedQuery = updatedQuery.replace(placeholder, formattedValue)
    })

    updatedQuery = updatedQuery.replace(/query\s*\([^)]*\)\s*{/, 'query {')

    return updatedQuery.trim()
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
        :fieldsInFilter="props.fieldsInFilter"
        :disabled="isFields"
        @applyFilter="filterSearch"
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

    <div class="flex flex-col items-end gap-2">
      <Accordion class="w-full">
        <AccordionTab header="Query Graphql">
          <CodeEditor
            v-model="code"
            :initialValue="replaceVariablesInQuery(getLastQuery.query, getLastQuery.variables)"
          />
        </AccordionTab>
      </Accordion>
      <PrimeButton
        label="Search By Query"
        size="small"
        class="h-auto w-full md:max-w-fit"
        data-testid="search-filter-search-button"
        @click="filterSearchUserQuery()"
      />
    </div>
  </div>
</template>
