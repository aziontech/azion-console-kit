<script setup>
  import Illustration from '@/assets/svg/illustration-layers'
  import ContentBlock from '@/templates/content-block'
  import EmptyEdgeNode from '@/templates/empty-results-block/empty-edge-node'
  import ListTableBlock from '@/templates/list-table-block'
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

  let hasContentToList = true

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

  const edgeNodeSelected = ref({})

  const actionsRow = ref([
    {
      label: 'Authorize',
      icon: 'pi pi-fw pi-check-square',
      command: (item) => {
        edgeNodeSelected.value = {
          edgeNodeID: item.id,
          openDialog: true,
          rerender: Math.random()
        }
      }
    }
  ])

  const handleLoadData = (event) => {
    hasContentToList = event
  }
</script>
<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edge Nodes"></PageHeadingBlock>
    </template>
    <template #content>
      <Authorize :authorize="edgeNodeSelected" />
      <ListTableBlock
        v-if="hasContentToList"
        :listService="props.listEdgeNodeService"
        :deleteService="props.deleteEdgeNodeService"
        :columns="getColumns"
        pageTitleDelete="Edge Node"
        editPagePath="edge-node/edit"
        @on-load-data="handleLoadData"
        :rowActions="actionsRow"
        emptyListMessage="No Edge Node found."
      />
      <EmptyEdgeNode
        v-else
        :documentationService="props.documentationService"
      >
        <template #illustration>
          <Illustration />
        </template>
      </EmptyEdgeNode>
    </template>
  </ContentBlock>
</template>
