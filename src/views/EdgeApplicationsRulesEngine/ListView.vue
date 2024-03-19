<script setup>
  import Illustration from '@/assets/svg/illustration-layers'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import DrawerRulesEngine from '@/views/EdgeApplicationsRulesEngine/Drawer'
  import ListTableBlock from '@/templates/list-table-block/no-header'
  import PrimeButton from 'primevue/button'
  import SelectButton from 'primevue/selectbutton'
  import { computed, ref, watch } from 'vue'

  defineOptions({ name: 'list-edge-applications-device-groups-tab' })

  const props = defineProps({
    edgeApplicationId: {
      required: true,
      type: String
    },
    listRulesEngineService: {
      required: true,
      type: Function
    },
    deleteRulesEngineService: {
      required: true,
      type: Function
    },
    reorderRulesEngine: {
      required: true,
      type: Function
    },
    loadRulesEngineService: {
      required: true,
      type: Function
    },
    editRulesEngineService: {
      required: true,
      type: Function
    },
    createRulesEngineService: {
      required: true,
      type: Function
    },
    documentationService: {
      required: true,
      type: Function
    },
    isEnableApplicationAccelerator: {
      required: true,
      type: Boolean
    },
    isDeliveryProtocolHttps: {
      required: true,
      type: Boolean
    },
    listEdgeApplicationFunctionsService: {
      required: true,
      type: Function
    },
    listCacheSettingsService: {
      required: true,
      type: Function
    },
    listOriginsService: {
      required: true,
      type: Function
    }
  })

  const hasContentToList = ref(true)

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name'
      },
      {
        field: 'phase',
        header: 'Phase',
        type: 'component',
        filterPath: 'phase.content',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
        }
      },
      {
        field: 'status',
        header: 'Status',
        type: 'component',
        filterPath: 'status.content',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
        }
      },
      {
        field: 'description',
        header: 'Description'
      }
    ]
  })

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const phaseOptions = ref(['Request phase', 'Response phase'])
  const selectedPhase = ref('Request phase')
  const parsePhase = {
    'Request phase': 'request',
    'Response phase': 'response'
  }
  const listRulesEngineWithDecorator = async () => {
    return props.listRulesEngineService({
      id: props.edgeApplicationId,
      phase: parsePhase[selectedPhase.value]
    })
  }

  const deleteRulesEngineWithDecorator = async (ruleId, ruleData) => {
    const phase =
      ruleData.phase.content == 'Default' ? 'request' : ruleData.phase.content.toLowerCase()

    return await props.deleteRulesEngineService({
      edgeApplicationId: props.edgeApplicationId,
      ruleId,
      phase
    })
  }

  const reorderRulesEngineWithDecorator = async (tableData) => {
    return props.reorderRulesEngine(tableData, props.edgeApplicationId)
  }

  const listRulesEngineRef = ref(null)
  watch(selectedPhase, () => {
    listRulesEngineRef.value.reload()
  })

  const reloadList = () => {
    if (hasContentToList.value) {
      listRulesEngineRef.value.reload()
      return
    }
    hasContentToList.value = true
  }

  const drawerRulesEngineRef = ref('')
  const openCreateRulesEngineDrawer = () => {
    drawerRulesEngineRef.value.openDrawerCreate()
  }

  const openCreateRulesEngineDrawerByPhase = () => {
    parsePhase[selectedPhase.value]
    drawerRulesEngineRef.value.openDrawerCreate(parsePhase[selectedPhase.value])
  }

  const openEditRulesEngineDrawer = (item) => {
    drawerRulesEngineRef.value.openDrawerEdit(item)
  }

  const titleEmptyState = computed(() => `No rule in the ${selectedPhase.value} has been created`)
  const descriptionEmptyState = computed(
    () => `Click the button below to create your first ${selectedPhase.value} rule.`
  )
</script>

<template>
  <DrawerRulesEngine
    ref="drawerRulesEngineRef"
    :isEnableApplicationAccelerator="props.isEnableApplicationAccelerator"
    :isDeliveryProtocolHttps="props.isDeliveryProtocolHttps"
    :listEdgeApplicationFunctionsService="props.listEdgeApplicationFunctionsService"
    :listOriginsService="props.listOriginsService"
    :listCacheSettingsService="props.listCacheSettingsService"
    :edgeApplicationId="props.edgeApplicationId"
    :createRulesEngineService="props.createRulesEngineService"
    :editRulesEngineService="props.editRulesEngineService"
    :loadRulesEngineService="props.loadRulesEngineService"
    :documentationService="props.documentationService"
    @onSuccess="reloadList"
  />
  <ListTableBlock
    ref="listRulesEngineRef"
    pageTitleDelete="rule"
    :reorderableRows="true"
    :columns="getColumns"
    :onReorderService="reorderRulesEngineWithDecorator"
    :editInDrawer="openEditRulesEngineDrawer"
    :listService="listRulesEngineWithDecorator"
    :deleteService="deleteRulesEngineWithDecorator"
    @on-load-data="handleLoadData"
    :pt="{
      thead: { class: !hasContentToList && 'hidden' }
    }"
    emptyListMessage="No rules have been created."
  >
    <template #addButton>
      <div class="flex gap-4">
        <SelectButton
          v-model="selectedPhase"
          :options="phaseOptions"
          :unselectable="true"
        />
        <PrimeButton
          icon="pi pi-plus"
          label="Rule"
          @click="openCreateRulesEngineDrawer"
        />
      </div>
    </template>

    <template #noRecordsFound>
      <EmptyResultsBlock
        :title="titleEmptyState"
        :description="descriptionEmptyState"
        :createButtonLabel="selectedPhase"
        :documentationService="props.documentationService"
        :inTabs="true"
        :noBorder="true"
      >
        <template #default>
          <PrimeButton
            @click="openCreateRulesEngineDrawerByPhase"
            severity="secondary"
            icon="pi pi-plus"
            label="Rule"
          />
        </template>
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ListTableBlock>
</template>
