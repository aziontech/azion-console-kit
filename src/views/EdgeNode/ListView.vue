<script setup>
  import { computed, ref } from 'vue'
  import PrimeButton from 'primevue/button'
  import ContentBlock from '@/templates/content-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import ListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { edgeNodeService } from '@/services/v2/edge-node/edge-node-service'
  import { COLUMN_STYLES, columnStyles } from '@/helpers/column-styles'
  import Authorize from '@/views/EdgeNode/Dialog/Authorize'

  defineOptions({ name: 'list-edge-node' })

  defineProps({
    documentationService: {
      type: Function,
      required: true
    }
  })

  let hasContentToList = ref(true)

  const getColumns = computed(() => [
    {
      field: 'name',
      header: 'Name',
      style: columnStyles.priority(2, 200, 350)
    },
    {
      field: 'hashId',
      header: 'Hash ID',
      style: COLUMN_STYLES.FIT_CONTENT
    },
    {
      field: 'groups',
      header: 'Group',
      type: 'component',
      style: columnStyles.priority(3, 200, 300),
      component: (columnData) =>
        columnBuilder({
          data: Array.isArray(columnData)
            ? columnData.map((group) => group.name || group)
            : columnData,
          columnAppearance: 'text-array-with-popup'
        })
    },
    {
      field: 'status',
      header: 'Status',
      type: 'component',
      style: COLUMN_STYLES.FIT_CONTENT,
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
      filterPath: 'last_editor',
      style: COLUMN_STYLES.PRIORITY_SM
    },
    {
      field: 'lastModified',
      header: 'Last Modified',
      sortField: 'lastModified',
      filterPath: 'lastModified',
      style: COLUMN_STYLES.FIT_CONTENT
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
        body: (item, reload) => ({
          data: {
            edgeNodeID: item.id,
            openDialog: true,
            rerender: Math.random()
          },
          onClose: (opt) => opt.data?.updated && reload()
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
