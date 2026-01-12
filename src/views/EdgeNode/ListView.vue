<script setup>
  import ContentBlock from '@/templates/content-block'
  import ListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import Authorize from '@/views/EdgeNode/Dialog/Authorize'
  import { computed, ref } from 'vue'
  import PrimeButton from 'primevue/button'

  defineOptions({ name: 'list-edge-node' })

  const props = defineProps({
    listEdgeNodeService: {
      type: Function,
      required: true
    },
    deleteEdgeNodeService: {
      type: Function,
      required: true
    },
    documentationService: {
      type: Function,
      required: true
    }
  })

  let hasContentToList = ref(true)

  const getColumns = computed(() => [
    {
      field: 'name',
      header: 'Name'
    },
    {
      field: 'hashId',
      header: 'Hash ID'
    },
    {
      field: 'groups',
      header: 'Group',
      type: 'component',
      component: (columnData) =>
        columnBuilder({ data: columnData, columnAppearance: 'text-array-with-popup' })
    },
    {
      field: 'status',
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
      header: 'Last Editor',
      sortField: 'last_editor',
      filterPath: 'last_editor'
    },
    {
      field: 'lastModified',
      header: 'Last Modified',
      sortField: 'lastModified',
      filterPath: 'lastModified'
    }
  ])

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const actions = [
    {
      type: 'delete',
      label: 'Delete',
      title: 'edge node',
      icon: 'pi pi-trash',
      service: props.deleteEdgeNodeService
    },
    {
      type: 'dialog',
      label: 'Authorize',
      icon: 'pi pi-fw pi-check-square',
      dialog: {
        component: Authorize,
        body: (item) => ({
          data: {
            edgeNodeID: item.id,
            openDialog: true,
            rerender: Math.random()
          }
        })
      }
    }
  ]
  function downloadOrchestrator() {
    window.open(
      'https://www.azion.com/en/documentation/products/guides/deploy/install-orchestrator-agent/',
      '_blank'
    )
  }
</script>
<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Edge Nodes"
        description="Monitor and manage nodes for optimal performance."
      ></PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        :listService="listEdgeNodeService"
        :columns="getColumns"
        editPagePath="/edge-node/edit"
        @on-load-data="handleLoadData"
        emptyListMessage="No edge nodes found."
        :actions="actions"
        :emptyBlock="{
          title: 'No edge nodes have been added',
          description:
            'To begin the Edge Node installation process, download the appropriate Orchestrator installation binary.',
          documentationService: documentationService,
          emptyListMessage: 'No edge nodes found.'
        }"
      >
        <template #emptyBlockButton>
          <PrimeButton
            severity="secondary"
            icon="pi pi-download"
            label="Orchestrator"
            @click="downloadOrchestrator"
          />
        </template>
      </ListTableBlock>
    </template>
  </ContentBlock>
</template>
