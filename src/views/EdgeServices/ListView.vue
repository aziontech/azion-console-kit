<script setup>
  import ListTableBlock from '@/templates/list-table-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import EdgeServicesToggleStatus from './dialog/EdgeServicesToggleStatus'
  import { computed, ref } from 'vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'

  import { useRouter } from 'vue-router'
  defineOptions({ name: 'edge-services-view' })

  const props = defineProps({
    listEdgeServicesService: {
      type: Function,
      required: true
    },
    deleteEdgeServicesService: {
      type: Function,
      required: true
    },
    editEdgeServicesService: {
      type: Function,
      required: true
    },
    documentationService: {
      type: Function,
      required: true
    }
  })

  const router = useRouter()
  const hasContentToList = ref(true)
  const selectRow = ref({})
  const visibleDialog = ref(false)
  const actionsRow = ref([
    {
      label: 'Inactivate',
      icon: 'pi pi-minus-circle',
      visibleAction: (item) => !item.active,
      command: (item) => {
        selectRow.value = item
        visibleDialog.value = true
      }
    },
    {
      label: 'Active',
      icon: 'pi pi-plus-circle',
      visibleAction: (item) => item.active,
      command: (item) => {
        selectRow.value = item
        visibleDialog.value = true
      }
    }
  ])

  const getColumns = computed(() => [
    {
      field: 'name',
      header: 'Name'
    },
    {
      field: 'labelActive',
      header: 'Status',
      type: 'component',
      component: (columnData) =>
        columnBuilder({
          data: columnData,
          columnAppearance: 'tag'
        })
    },
    {
      field: 'lastEditor',
      header: 'Last Editor'
    },
    {
      field: 'lastModified',
      sortField: 'lastModifiedDate',
      header: 'Last Modified'
    }
  ])

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }
  const updateView = () => {
    router.go({ name: 'edge-services' })
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edge Services"></PageHeadingBlock>
    </template>
    <template #content>
      <EdgeServicesToggleStatus
        v-model:visible="visibleDialog"
        :serviceUpdate="props.editEdgeServicesService"
        :selectRow="selectRow"
        @updateService="updateView"
      />
      <ListTableBlock
        v-if="hasContentToList"
        :listService="props.listEdgeServicesService"
        :deleteService="props.deleteEdgeServicesService"
        :columns="getColumns"
        pageTitleDelete="Edge Service"
        addButtonLabel="Edge Services"
        createPagePath="edge-services/create"
        editPagePath="edge-services/edit"
        @on-load-data="handleLoadData"
        :rowActions="actionsRow"
      />

      <EmptyResultsBlock
        v-else
        title="No edge services added"
        description="Create your first edge service."
        createButtonLabel="Edge Services"
        createPagePath="edge-services/create"
        :documentationService="props.documentationService"
      >
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>
