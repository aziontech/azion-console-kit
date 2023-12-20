<script setup>
  import ListTableBlock from '@/templates/list-table-block/no-header'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import PrimeButton from 'primevue/button'
  import Illustration from '@/assets/svg/illustration-layers'
  import { computed, ref } from 'vue'
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
    deleteRulesEngineervice: {
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
        header: 'Phase'
      },
      {
        field: 'status',
        header: 'Status'
      },
      {
        field: 'description',
        header: 'Description'
      },
      {
        field: 'lastModified',
        header: 'Last modified'
      }
    ]
  })

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const listRulesEngineWithDecorator = async () => {
    return await props.listRulesEngineService({ id: props.edgeApplicationId })
  }

  const deleteRulesEngineWithDecorator = async (id) => {
    return await props.deleteRulesEngineervice(id, props.edgeApplicationId)
  }
</script>

<template>
  <div v-if="hasContentToList">
    <ListTableBlock
      pageTitleDelete="Device Groups"
      :listService="listRulesEngineWithDecorator"
      :deleteService="deleteRulesEngineWithDecorator"
      :editInDrawer="openEditDeviceGroupDrawer"
      :columns="getColumns"
      @on-load-data="handleLoadData"
    >
      <template #addButton>
        <PrimeButton
          @click="openCreateDeviceGroupDrawer"
          icon="pi pi-plus"
          label="Device Group"
        />
      </template>
    </ListTableBlock>
  </div>
  <EmptyResultsBlock
    v-else
    title="No Device Group have been created"
    description="Create your first Device Group."
    createButtonLabel="Add"
    :documentationService="props.documentationService"
    :inTabs="true"
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
