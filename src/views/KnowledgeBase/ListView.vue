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
        exportFileName="knowledge-base"
        :enableEditClick="false"
        @on-before-go-to-add-page="handleCreateTrackEvent"
        @on-row-click="handleRowClick"
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
  import { useRouter } from 'vue-router'
  import { computed, ref, inject } from 'vue'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const router = useRouter()

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

  const handleRowClick = (item) => {
    if (!item || !item.id) {
      return
    }

    // Track analytics if available
    try {
      if (tracker && tracker.product && typeof tracker.product.clickToView === 'function') {
        tracker.product.clickToView({
          productName: 'Knowledge Base'
        })
      }
    } catch (error) {
      // Silently fail on analytics errors
    }

    router.push(`/ai/knowledge-base/${item.id}`)
  }

  const handleEdit = (item) => {
    // Track analytics if available
    try {
      if (tracker && tracker.product && typeof tracker.product.clickToEdit === 'function') {
        tracker.product.clickToEdit({
          productName: 'Knowledge Base'
        })
      }
    } catch (error) {
      // Silently fail on analytics errors
    }
    router.push(`/ai/knowledge-base/edit/${item.id}`)
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
      filterPath: 'lastEditor',
      sortField: 'lastEditor'
    },
    {
      field: 'updatedAt',
      header: 'Last Modified',
      sortable: true,
      filterPath: 'updatedAtDate',
      sortField: 'updatedAtDate'
    }
  ])
</script>
