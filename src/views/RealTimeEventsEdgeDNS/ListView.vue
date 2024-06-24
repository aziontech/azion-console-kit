<script setup>
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block/no-header'
  import PrimeButton from 'primevue/button'
  import { computed, ref } from 'vue'
  import IntervalFilterBlock from '@/views/RealTimeEvents/blocks/interval-filter-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import Drawer from './Drawer'
  import { useRouter } from 'vue-router'
  const emit = defineEmits(['update:dateTime'])

  const props = defineProps({
    documentationService: {
      type: Function,
      required: true
    },
    loadEdgeDNS: {
      type: Function,
      required: true
    },
    listEdgeDNS: {
      type: Function,
      required: true
    },
    dateTime: {
      type: Object,
      default: () => ({})
    }
  })

  const filterDate = computed({
    get: () => {
      return props.dateTime
    },
    set: (value) => {
      emit('update:dateTime', value)
    }
  })

  const hasContentToList = ref(true)
  const listTableBlockRef = ref('')
  const drawerRef = ref('')
  const router = useRouter()

  const openDetailDrawer = ({ uuid, ts, source }) => {
    drawerRef.value.openDetailDrawer({
      tsRange: filterDate.value,
      uuid,
      source,
      ts
    })
  }

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const reloadList = () => {
    if (hasContentToList.value) {
      listTableBlockRef.value.reload()
      return
    }
    hasContentToList.value = true
  }

  const listProvider = async () => {
    return await props.listEdgeDNS({ tsRange: filterDate.value })
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'level',
        header: 'Level',
        type: 'component',
        filterPath: 'level.content',
        component: (columnData) =>
          columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
      },
      {
        field: 'zoneId',
        header: 'Zone ID'
      },
      {
        field: 'qtype',
        header: 'Q Type'
      },
      {
        field: 'resolutionType',
        header: 'Resolution Type'
      },
      {
        field: 'solutionId',
        header: 'Solution ID'
      },
      {
        field: 'tsFormat',
        header: 'TS'
      }
    ]
  })

  const goToCreateEdgeDNS = () => {
    router.push({ name: 'create-edge-dns' })
  }
</script>

<template>
  <Drawer
    ref="drawerRef"
    :loadService="props.loadEdgeDNS"
  />
  <div class="flex flex-col gap-8 my-4">
    <div class="flex gap-1">
      <p class="text-xs font-medium leading-4">Logs of events from queries made to Edge DNS.</p>
    </div>
    <IntervalFilterBlock
      v-model:filterDate="filterDate"
      @applyTSRange="reloadList"
    />
  </div>
  <ListTableBlock
    v-if="hasContentToList && filterDate.tsRangeBegin"
    ref="listTableBlockRef"
    :listService="listProvider"
    :columns="getColumns"
    :editInDrawer="openDetailDrawer"
    @on-load-data="handleLoadData"
    emptyListMessage="No logs have been found for this period."
  />

  <EmptyResultsBlock
    v-else
    title="No logs have been found for this period."
    description="Use the filter to change time range and variables, or create a new zone. Logs are displayed once there are incoming requests and traffic."
    :documentationService="documentationService"
    :inTabs="true"
  >
    <template #default>
      <PrimeButton
        class="max-md:w-full w-fit"
        severity="secondary"
        icon="pi pi-plus"
        label="Edge DNS"
        @click="goToCreateEdgeDNS"
      />
    </template>
  </EmptyResultsBlock>
</template>
