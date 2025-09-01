<script setup>
  import ListTableBlock from '@/templates/list-table-block'
  import { computed, onBeforeMount, onMounted, ref } from 'vue'
  import AdvancedFilterSystem from '@/components/base/advanced-filter-system/index.vue'
  import { useRouteFilterManager } from '@/helpers'
  import * as Drawer from '@/views/RealTimeEvents/Drawer'
  import { eventsPlaygroundOpener } from '@/helpers'
  import PrimeButton from 'primevue/button'
  import PrimeTag from 'primevue/tag'

  defineOptions({ name: 'TabPanelBlock' })

  const props = defineProps({
    loadService: {
      type: Function,
      required: true
    },
    getTotalRecords: {
      type: Function,
      required: true
    },
    listService: {
      type: Function
    },
    tabSelected: {
      type: Object
    },
    filterFields: {
      type: Array,
      default: () => []
    }
  })

  const { getFiltersFromHash, setFilterInHash } = useRouteFilterManager()
  const listTableBlockRef = ref(null)
  const drawerRef = ref(null)
  const filterData = ref(null)
  const recordsFound = ref(0)

  const defaultFilter = {
    tsRange: {
      tsRangeBegin: new Date(new Date().setMinutes(new Date().getMinutes() - 5)),
      tsRangeEnd: new Date(),
      label: 'Last 5 minutes'
    },
    fields: [],
    dataset: ''
  }

  const drawerComponent = computed(() => {
    return Drawer[props.tabSelected.panel]
  })

  const isTabSelected = computed(() => {
    return !!props.tabSelected?.tabRouter
  })

  const openDetailDrawer = (row) => {
    drawerRef.value.openDetailDrawer({
      ...filterData.value,
      ...row
    })
  }

  const reloadListTable = async () => {
    listTableBlockRef.value?.reload()
  }

  const reloadListTableWithHash = async () => {
    await setFilterInHash({
      ...filterData.value,
      dataset: props.tabSelected.dataset
    })
    reloadListTable()
  }

  const refreshFilterData = () => {
    const filter = getFiltersFromHash()
    filterData.value = defaultFilter
    if (filter) {
      filterData.value = filter
      filterData.value.fields = filter.dataset === props.tabSelected.dataset ? filter.fields : []
    }
  }

  const listProvider = async () => {
    const [response, total] = await Promise.all([
      props.listService({ ...filterData.value }),
      props.getTotalRecords({ filter: { ...filterData.value }, dataset: props.tabSelected.dataset })
    ])

    recordsFound.value = total
    return response.data
  }

  onBeforeMount(() => {
    refreshFilterData()
  })

  const totalRecordsFound = computed(() => {
    return `${recordsFound.value} records found`
  })

  onMounted(() => {
    reloadListTable()
  })
</script>

<template>
  <data v-if="isTabSelected">
    <component
      :is="drawerComponent"
      ref="drawerRef"
      :loadService="loadService"
    />
    <div class="flex flex-col gap-8 my-4">
      <div class="flex gap-1">
        <p class="text-xs text-color font-medium leading-4">Specification</p>
        <p class="text-xs text-color-secondary font-normal leading-4">
          {{ props.tabSelected.description }}
        </p>
      </div>
    </div>
    <div class="border-1 p-4 surface-border rounded-md mb-2">
      <AdvancedFilterSystem
        v-model:filterData="filterData"
        :fieldsInFilter="props.filterFields"
        @updatedFilter="reloadListTableWithHash"
      />
    </div>
    <div class="flex flex-col gap-2">
      <div class="flex gap-2 justify-end">
        <PrimeTag
          :value="totalRecordsFound"
          severity="info"
        />
        <PrimeButton
          outlined
          icon="ai ai-graphql"
          class="min-w-max"
          @click="eventsPlaygroundOpener"
          v-tooltip.top="{ value: 'View on GraphQL', showDelay: 200 }"
          data-testid="data-table-actions-column-header-toggle-columns"
        />
      </div>
      <ListTableBlock
        lazyLoad
        hiddenHeader
        :pt="{ bodyRow: { 'data-testid': 'table-body-row' } }"
        isGraphql
        frozenSize="3rem"
        ref="listTableBlockRef"
        :listService="listProvider"
        :columns="props.tabSelected.columns"
        :editInDrawer="openDetailDrawer"
        emptyListMessage="No logs have been found for this period."
        :csvMapper="props.tabSelected.customColumnMapper"
        :exportFileName="`${props.tabSelected.tabRouter}-logs`"
        data-testid="table-tab-panel-block"
      >
        <template #actions-header="{ exportTableCSV }">
          <PrimeButton
            outlined
            icon="pi pi-download"
            class="min-w-max"
            @click="exportTableCSV"
            v-tooltip.top="{ value: 'Export to CSV', showDelay: 200 }"
            data-testid="data-table-actions-column-header-toggle-columns"
          />
        </template>
      </ListTableBlock>
    </div>
  </data>
</template>
