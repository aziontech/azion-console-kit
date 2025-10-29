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
        enableEditClick
        editPagePath="/ai/knowledge-base"
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
  import { knowledgeBaseService } from '@/services/v2/knowledge-base/knowledge-base-service'
  import { useRouter } from 'vue-router'
  import { computed, ref, inject } from 'vue'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const router = useRouter()

  defineOptions({ name: 'knowledge-base-view' })

  const listServiceRef = ref(null)

  const listKnowledgeBaseService = knowledgeBaseService.listKnowledgeBases
  const deleteKnowledgeBaseService = knowledgeBaseService.deleteKnowledgeBase

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
    router.push(`/ai/knowledge-base/edit/${item.kbId}`)
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
      service: deleteKnowledgeBaseService
    }
  ]

  const handleCreateTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'Knowledge Base'
    })
  }

  const getColumns = computed(() => [
    {
      field: 'kbId',
      header: 'ID',
      sortable: true,
      filterPath: 'kbId',
      sortField: 'kbId'
    },
    {
      field: 'name',
      header: 'Name',
      sortable: true,
      filterPath: 'name',
      sortField: 'name'
    },
    {
      field: 'storage',
      header: 'Storage',
      sortable: true,
      filterPath: 'storage',
      sortField: 'storage'
    },
    {
      field: 'sqlDbName',
      header: 'SQL',
      sortable: true,
      filterPath: 'sqlDbName',
      sortField: 'sqlDbName'
    },
    {
      field: 'lastEditor',
      header: 'Last Editor',
      sortable: true,
      filterPath: 'lastEditor',
      sortField: 'lastEditor'
    },
    {
      field: 'lastModified',
      header: 'Last Modified',
      sortable: true,
      filterPath: 'lastModified',
      sortField: 'lastModified'
    }
  ])
</script>
