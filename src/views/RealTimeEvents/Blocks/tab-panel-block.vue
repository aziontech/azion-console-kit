<script setup>
  import ListTableBlock from '@/templates/list-table-block'
  import { computed, onBeforeMount, onMounted, ref } from 'vue'
  import ContentFilterBlock from '@/views/RealTimeEvents/Blocks/content-filter-block'
  import { useRouteFilterManager } from '@/helpers'
  import * as Drawer from '@/views/RealTimeEvents/Drawer'

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
    tsRange: {},
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

  const exportTableCSV = () => {
    listTableBlockRef.value?.handleExportTableDataToCSV()
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
    <div class="border-1 border-bottom-none border-round-top-xl p-3.5 surface-border rounded-md">
      <ContentFilterBlock
        v-model:filterData="filterData"
        :fieldsInFilter="props.filterFields"
        :downloadCSV="exportTableCSV"
        :recordsFound="recordsFound"
        @updatedFilter="reloadListTableWithHash"
      />
    </div>
    <ListTableBlock
      lazyLoad
      hiddenHeader
      :pt="{ root: { class: 'rounded-t-none' } }"
      isGraphql
      frozenSize="3rem"
      ref="listTableBlockRef"
      :listService="listProvider"
      :columns="props.tabSelected.columns"
      :editInDrawer="openDetailDrawer"
      emptyListMessage="No logs have been found for this period."
      :csvMapper="props.tabSelected.customColumnMapper"
      :exportFileName="`${props.tabSelected.tabRouter}-logs`"
    />
  </data>
</template>
