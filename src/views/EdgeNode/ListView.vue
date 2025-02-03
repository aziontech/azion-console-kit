<script setup>
  import ContentBlock from '@/templates/content-block'
  import EmptyEdgeNode from '@/templates/empty-results-block/empty-edge-node'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import Authorize from '@/views/EdgeNode/Dialog/Authorize'
  import { computed, ref } from 'vue'

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
      field: 'status',
      header: 'Status',
      type: 'component',
      component: (columnData) =>
        columnBuilder({
          data: columnData,
          columnAppearance: 'tag'
        })
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

  const EDGE_NODE_API_FIELDS = ['id', 'name', 'hash_id', 'status']
</script>
<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edge Nodes"></PageHeadingBlock>
    </template>
    <template #content>
      <FetchListTableBlock
        v-if="hasContentToList"
        :apiFields="EDGE_NODE_API_FIELDS"
        :listService="listEdgeNodeService"
        :columns="getColumns"
        editPagePath="edge-node/edit"
        @on-load-data="handleLoadData"
        emptyListMessage="No edge nodes found."
        :actions="actions"
      />
      <EmptyEdgeNode
        v-else
        :documentationService="documentationService"
      >
      </EmptyEdgeNode>
    </template>
  </ContentBlock>
</template>
