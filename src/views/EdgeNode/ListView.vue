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
        addButtonLabel=""
        createPagePath=""
        editPagePath="edge-node/edit"
        @on-load-data="handleLoadData"
        :rowActions="actionsRow"
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
<script setup>
  import ListTableBlock from '@/templates/list-table-block'
  import EmptyEdgeNode from '@/templates/empty-results-block/empty-edge-node.vue'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import Authorize from './Dialog/authorize'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { computed, ref } from 'vue'

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
      header: 'HashID'
    },
    {
      field: 'groups',
      header: 'Group'
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
