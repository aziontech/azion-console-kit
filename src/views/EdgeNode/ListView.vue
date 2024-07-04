<script setup>
  import Illustration from '@/assets/svg/illustration-layers'
  import ContentBlock from '@/templates/content-block'
  import EmptyEdgeNode from '@/templates/empty-results-block/empty-edge-node'
  import ListTableBlock from '@/templates/list-table-block/index.vue'
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
      field: 'groups',
      header: 'Group',
      type: 'component',
      component: (columnData) =>
        columnBuilder({ data: columnData, columnAppearance: 'expand-column' })
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
</script>
<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edge Nodes"></PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
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
        <template #illustration>
          <Illustration />
        </template>
      </EmptyEdgeNode>
    </template>
  </ContentBlock>
</template>
