<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Data Stream" />
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        addButtonLabel="Stream"
        createPagePath="/data-stream/create"
        editPagePath="/data-stream/edit"
        :listService="listDataStreamService"
        :columns="getColumns"
        @on-load-data="handleLoadData"
        emptyListMessage="No streams found."
        :actions="actions"
      ></ListTableBlock>
      <EmptyResultsBlock
        v-else
        title="No stream has been created"
        description="Click the button below to create your first stream."
        createButtonLabel="Stream"
        createPagePath="data-stream/create"
        :documentationService="documentationService"
      >
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block/index.vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'

  defineOptions({ name: 'data-stream-view' })

  const props = defineProps({
    listDataStreamService: {
      required: true,
      type: Function
    },
    deleteDataStreamService: {
      required: true,
      type: Function
    },
    documentationService: {
      required: true,
      type: Function
    }
  })

  const hasContentToList = ref(true)
  const actions = [
    {
      type: 'delete',
      title: 'stream',
      icon: 'pi pi-trash',
      service: props.deleteDataStreamService
    }
  ]

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name'
      },
      {
        field: 'dataSource',
        header: 'Source'
      },
      {
        field: 'templateName',
        header: 'Template'
      },
      {
        field: 'endpointType',
        header: 'Connector'
      },
      {
        field: 'active',
        header: 'Status',
        type: 'component',
        component: (columnData) =>
          columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
      }
    ]
  })
</script>
