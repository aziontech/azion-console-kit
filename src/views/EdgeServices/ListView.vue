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

  const hasContentToList = ref(true)

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

  const actions = [
    {
      type: 'dialog',
      label: 'Activate',
      icon: 'pi pi-plus-circle',
      visibleAction: (item) => !item.active,
      dialog: {
        component: EdgeServicesToggleStatus,
        body: (item, updatedTable) => ({
          data: {
            selectRow: item,
            service: props.editEdgeServiceServices
          },
          onClose: (opt) => opt.data.updated && updatedTable()
        })
      }
    },
    {
      type: 'dialog',
      label: 'Deactivate',
      icon: 'pi pi-minus-circle',
      visibleAction: (item) => item.active,
      dialog: {
        component: EdgeServicesToggleStatus,
        body: (item, updatedTable) => ({
          data: {
            selectRow: item,
            service: props.editEdgeServiceServices
          },
          onClose: (opt) => opt.data.updated && updatedTable()
        })
      }
    },
    {
      type: 'delete',
      label: 'Delete',
      title: 'service',
      icon: 'pi pi-trash',
      service: props.deleteEdgeServiceServices
    }
  ]
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edge Services"></PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        :listService="listEdgeServiceServices"
        :columns="getColumns"
        addButtonLabel="Service"
        createPagePath="edge-services/create"
        editPagePath="edge-services/edit"
        @on-load-data="handleLoadData"
        :actions="actions"
        emptyListMessage="No services found."
      />

      <EmptyResultsBlock
        v-else
        title="No services have been created"
        description="Click the button below to create your first service."
        createButtonLabel="Service"
        createPagePath="edge-services/create"
        :documentationService="documentationService"
      >
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>
