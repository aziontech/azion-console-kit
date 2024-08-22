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
    listService: {
      type: Function
    },
    tabSelected: {
      type: Object
    },
    allFields: {
      type: Array,
      default: () => []
    }
  })

  const { getFiltersFromHash, setFilterInHash } = useRouteFilterManager()
  const listTableBlockRef = ref(null)
  const drawerRef = ref(null)
  const filterData = ref(null)
  const pullHash = ref(false)

  const defaultFilter = {
    tsRange: {},
    fields: [],
    dataset: ''
  }

  const drawerComponent = computed(() => {
    return Drawer[props.tabSelected.panel]
  })

  const isTabSelected = computed(() => {
    return !!props.tabSelected?.tabRouter && pullHash.value
  })

  const openDetailDrawer = (row) => {
    drawerRef.value.openDetailDrawer({
      ...filterData.value,
      ...row
    })
  }

  const reloadListTable = () => {
    listTableBlockRef.value?.reload()
    setFilterInHash({
      ...filterData.value,
      dataset: props.tabSelected.dataset
    })
  }

  const exportTableCSV = () => {
    listTableBlockRef.value?.handleExportTableDataToCSV()
  }

  const resetFilter = () => {
    const filter = getFiltersFromHash()
    filterData.value = defaultFilter
    if (filter) {
      filterData.value = filter
      filterData.value.fields = filter.dataset === props.tabSelected.dataset ? filter.fields : []
    }
    pullHash.value = true
  }

  const listProvider = async () => {
    return await props.listService({ ...filterData.value })
  }

  onBeforeMount(() => {
    resetFilter()
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
        <p class="text-xs font-medium leading-4">
          {{ props.tabSelected.description }}
        </p>
      </div>
    </div>
    <div class="border-1 border-bottom-none border-round-top-xl p-3.5">
      <ContentFilterBlock
        v-model:filterData="filterData"
        :fieldsInFilter="props.allFields"
        :downloadCSV="exportTableCSV"
        @updatedFilter="reloadListTable"
      />
    </div>
    <ListTableBlock
      lazyLoad
      hiddenHeader
      :pt="{ root: { class: 'rounded-t-none' } }"
      isGraphql
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
