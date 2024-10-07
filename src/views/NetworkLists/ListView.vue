<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Network Lists"></PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        :listService="listNetworkListService"
        :columns="getColumns"
        addButtonLabel="Network List"
        createPagePath="network-lists/create"
        editPagePath="network-lists/edit"
        @on-load-data="handleLoadData"
        @on-before-go-to-add-page="handleCreateTrackEvent"
        @on-before-go-to-edit="handleTrackEditEvent"
        emptyListMessage="No network lists found."
        :actions="actions"
      />
      <EmptyResultsBlock
        v-else
        title="No network lists have been added"
        description="Click the button below to add a network list based on ASNs, countries, or IP addresses."
        createButtonLabel="Network List"
        @click-to-create="handleCreateTrackEvent"
        createPagePath="network-lists/create"
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
  import { computed, ref, inject } from 'vue'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block'
  import PageHeadingBlock from '@/templates/page-heading-block'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineOptions({ name: 'network-list-view' })

  const props = defineProps({
    listNetworkListService: {
      required: true,
      type: Function
    },
    deleteNetworkListService: {
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
      title: 'network list',
      icon: 'pi pi-trash',
      service: props.deleteNetworkListService
    }
  ]

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const handleCreateTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'Network List'
    })
  }

  const handleTrackEditEvent = () => {
    tracker.product.clickToEdit({
      productName: 'Network List'
    })
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name'
      },
      {
        field: 'listType',
        header: 'List Type'
      },
      {
        field: 'lastEditor',
        header: 'Last Editor'
      },
      {
        field: 'lastModified',
        sortField: 'lastModifiedDate',
        header: 'Last Modified'
      }
    ]
  })
</script>
