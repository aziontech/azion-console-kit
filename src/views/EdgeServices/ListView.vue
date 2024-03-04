<script setup>
  import Illustration from '@/assets/svg/illustration-layers'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import EdgeServicesToggleStatus from '@/views/EdgeServices/Dialog/EdgeServicesToggleStatus'
  import { computed, ref } from 'vue'
  defineOptions({ name: 'list-edge-service' })

  import { useRouter } from 'vue-router'

  const props = defineProps({
    listEdgeServiceServices: {
      type: Function,
      required: true
    },
    deleteEdgeServiceServices: {
      type: Function,
      required: true
    },
    editEdgeServiceServices: {
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
      label: 'Deactivate',
      icon: 'pi pi-minus-circle',
      visibleAction: (item) => !item.active,
      command: (item) => {
        selectRow.value = item
        visibleDialog.value = true
      }
    },
    {
      label: 'Activate',
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
      filterPath: 'labelActive.content',
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
        :serviceUpdate="props.editEdgeServiceServices"
        :selectRow="selectRow"
        @updateService="updateView"
      />
      <ListTableBlock
        v-if="hasContentToList"
        :listService="props.listEdgeServiceServices"
        :deleteService="props.deleteEdgeServiceServices"
        :columns="getColumns"
        pageTitleDelete="Service"
        addButtonLabel="Add"
        createPagePath="edge-services/create"
        editPagePath="edge-services/edit"
        @on-load-data="handleLoadData"
        :rowActions="actionsRow"
        emptyListMessage="No Service found."
      />

      <EmptyResultsBlock
        v-else
        title="No services have been created"
        description="Click the button below to initiate the setup process and create your first service."
        createButtonLabel="Add"
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
