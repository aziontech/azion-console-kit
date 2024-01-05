<script setup>
  import ListTableBlock from '@/templates/list-table-block/no-header'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import PrimeButton from 'primevue/button'
  import Illustration from '@/assets/svg/illustration-layers'
  import { computed, ref, watch } from 'vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import SelectButton from 'primevue/selectbutton'

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

  const listRulesEngine = ref(null)
  watch(selectedPhase, () => {
    listRulesEngine.value.loadData({ page: 1 })
  })
</script>

<template>
  <ListTableBlock
    ref="listRulesEngine"
    :reorderableRows="true"
    :onReorderService="reorderRulesEngineWithDecorator"
    pageTitleDelete="Rules Engine"
    :listService="listRulesEngineWithDecorator"
    :deleteService="deleteRulesEngineWithDecorator"
    :columns="getColumns"
    @on-load-data="handleLoadData"
    :pt="{
      thead: { class: !hasContentToList && 'hidden' }
    }"
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
          label="Rules Engine"
        />
      </div>
    </template>

    <template #empty>
      <EmptyResultsBlock
        title="No Rules Engine added"
        description="Create your first Rule Engine."
        createButtonLabel="Add"
        :documentationService="props.documentationService"
        :inTabs="true"
        :noBorder="true"
      >
        <template #default>
          <PrimeButton
            @click="openCreateDeviceGroupDrawer"
            severity="secondary"
            icon="pi pi-plus"
            label="Add"
          />
        </template>
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ListTableBlock>
</template>
