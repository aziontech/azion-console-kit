<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Knowledge Base" />
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        :listService="listKnowledgeBaseService"
        :columns="getColumns"
        addButtonLabel="Knowledge Base"
        createPagePath="/ai/knowledge-base/create"
        editPagePath="/ai/knowledge-base/edit"
        @on-load-data="handleLoadData"
        @on-before-go-to-add-page="handleCreateTrackEvent"
        @on-before-go-to-edit="handleTrackEditEvent"
        emptyListMessage="No Knowledge Base items found."
        :actions="actions"
      />
      <EmptyResultsBlock
        v-else
        title="No Knowledge Base items have been created"
        description="Click the button below to create your first Knowledge Base item."
        createButtonLabel="Knowledge Base"
        createPagePath="/ai/knowledge-base/create"
        @click-to-create="handleCreateTrackEvent"
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
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { computed, ref, inject } from 'vue'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineOptions({ name: 'knowledge-base-view' })

  const props = defineProps({
    listKnowledgeBaseService: {
      required: true,
      type: Function
    },
    deleteKnowledgeBaseService: {
      required: true,
      type: Function
    },
    documentationService: {
      required: true,
      type: Function
    }
  })

  let hasContentToList = ref(true)
  const actions = [
    {
      type: 'delete',
      title: 'knowledge base',
      icon: 'pi pi-trash',
      service: props.deleteKnowledgeBaseService
    }
  ]

  const handleCreateTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'Knowledge Base'
    })
  }

  const handleTrackEditEvent = () => {
    tracker.product.clickToEdit({
      productName: 'Knowledge Base'
    })
  }

  const getColumns = computed(() => [
    {
      field: 'id',
      header: 'ID',
      sortField: 'kb_id',
      filterPath: 'id'
    },
    {
      field: 'name',
      header: 'Name',
      filterPath: 'name',
      sortField: 'name'
    },
    {
      field: 'description',
      header: 'Description',
      filterPath: 'description'
    },
    {
      field: 'embeddingModel',
      header: 'Embedding Model',
      type: 'component',
      component: (columnData) => {
        return columnBuilder({
          data: columnData,
          columnAppearance: 'text-with-icon'
        })
      }
    },
    {
      field: 'lastEditor',
      header: 'Last Editor'
    },
    {
      field: 'updatedAt',
      header: 'Last Update',
      sortField: 'updated_at'
    }
  ])

  function handleLoadData(event) {
    hasContentToList.value = event
  }
</script>