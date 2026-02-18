<script setup>
  import ContentBlock from '@/templates/content-block'
  import ListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import Authorize from '@/views/EdgeNode/Dialog/Authorize'
  import { computed, ref } from 'vue'
  import PrimeButton from 'primevue/button'
  import { edgeNodeService } from '@/services/v2/edge-node/edge-node-service'

  defineOptions({ name: 'list-edge-node' })

  defineProps({
    documentationService: {
      required: true,
      type: Function
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
      service: edgeNodeService.deleteEdgeNodeService
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
        description="Deploy and manage Edge Nodes on your infrastructure and orchestrate Edge Services to them."
      ></PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        :listService="edgeNodeService.listEdgeNodeService"
        :columns="getColumns"
        editPagePath="/edge-node/edit"
        @on-load-data="handleLoadData"
        emptyListMessage="No edge nodes found."
        :actions="actions"
        exportFileName="Edge Nodes"
        :emptyBlock="{
          title: 'No Edge Nodes yet',
          description:
            'Create your first edge node and register it as an execution target for Edge Services.',
          documentationService: documentationService,
          emptyListMessage: 'No edge nodes found.'
        }"
      >
        <template #emptyBlockButton>
          <PrimeButton
            severity="secondary"
            icon="pi pi-download"
            label="Download Orchestrator"
            @click="downloadOrchestrator"
          />
        </template>
      </ListTableBlock>
    </template>
  </ContentBlock>
</template>
