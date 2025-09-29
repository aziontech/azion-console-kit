<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Knowledge Base" />
    </template>
    <template #content>
      <ListTableBlock
        ref="listServiceRef"
        :listService="listKnowledgeBaseService"
        :columns="getColumns"
        :actions="actions"
        addButtonLabel="Knowledge Base"
        createPagePath="/ai/knowledge-base/create"
        editPagePath="/ai/knowledge-base/edit"
        enableEditClick
        exportFileName="knowledge-base"
        @on-before-go-to-add-page="handleCreateTrackEvent"
        emptyListMessage="No Knowledge Base entries found."
        class="w-full"
      />
    </template>
  </ContentBlock>
</template>

<script setup>
  import ContentBlock from '@/templates/content-block'
  import ListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
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
    }
  })

  const listServiceRef = ref(null)
  const handleEdit = (item) => {
    tracker.product.clickToEdit({
      productName: 'Knowledge Base'
    })
    // The edit navigation is handled by the ListTableBlock editPagePath prop
  }

  const actions = [
    {
      type: 'action',
      label: 'Edit',
      icon: 'pi pi-pencil',
      commandAction: handleEdit
    },
    {
      type: 'delete',
      title: 'knowledge base',
      label: 'Delete',
      icon: 'pi pi-trash',
      service: props.deleteKnowledgeBaseService
    }
  ]

  const handleCreateTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'Knowledge Base'
    })
  }


  const getColumns = computed(() => [
    {
      field: 'name',
      header: 'Name',
      sortable: true,
      filterPath: 'name',
      sortField: 'name'
    },
    {
      field: 'lastEditor',
      header: 'Last Editor',
      sortable: true,
      sortField: 'updated_by'
    },
    {
      field: 'updatedAt',
      header: 'Last Modified',
      sortable: true,
      sortField: 'updated_at'
    }
  ])

</script>