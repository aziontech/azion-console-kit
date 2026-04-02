<script setup>
  import { computed, ref } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import Authorize from '@/views/EdgeNode/Dialog/Authorize'
  import { edgeNodeService } from '@/services/v2/edge-node/edge-node-service'
  import ListTable from '@/components/list-table'

  defineOptions({ name: 'list-edge-node' })

  defineProps({
    documentationService: {
      type: Function,
      required: true
    }
  })

  const listTableRef = ref()

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
      />
    </template>
    <template #content>
      <ListTable
        ref="listTableRef"
        emptyListMessage="No edge nodes found."
        :listService="edgeNodeService.listEdgeNodeService"
        :columns="getColumns"
        :actions="actions"
        editPagePath="/edge-node/edit"
        exportFileName="Edge Nodes"
        :lazy="true"
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
      </ListTable>
    </template>
  </ContentBlock>
</template>
