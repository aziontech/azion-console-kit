<script setup>
  import { computed, inject } from 'vue'
  import ContentBlock from '@/templates/content-block'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { networkListsService } from '@/services/v2/network-lists/network-lists-service'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineOptions({ name: 'network-list-view' })

  defineProps({
    documentationService: {
      required: true,
      type: Function
    }
  })

  const NETWORK_LIST_API_FIELDS = ['id', 'name', 'type', 'last_editor', 'last_modified']

  const actions = [
    {
      type: 'delete',
      title: 'network list',
      icon: 'pi pi-trash',
      service: networkListsService.deleteNetworkList
    }
  ]

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

  const csvMapper = (rowData) => {
    return {
      name: rowData.name,
      id: rowData.id,
      listType: rowData.listType,
      lastEditor: rowData.lastEditor,
      lastModified: rowData.lastModified
    }
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name',
        type: 'component',
        component: (columnData) => {
          return columnBuilder({
            data: { value: columnData, showMoreText: false },
            columnAppearance: 'expand-text-column'
          })
        }
      },
      {
        field: 'id',
        header: 'ID',
        sortField: 'id',
        filterPath: 'id'
      },
      {
        field: 'listType',
        header: 'List Type',
        sortField: 'type'
      }
    ]
  })
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Network Lists"></PageHeadingBlock>
    </template>
    <template #content>
      <FetchListTableBlock
        :listService="networkListsService.listNetworkLists"
        :columns="getColumns"
        addButtonLabel="Network List"
        createPagePath="network-lists/create"
        editPagePath="network-lists/edit"
        @on-load-data="handleLoadData"
        @on-before-go-to-add-page="handleCreateTrackEvent"
        @on-before-go-to-edit="handleTrackEditEvent"
        emptyListMessage="No network lists found."
        :actions="actions"
        :apiFields="NETWORK_LIST_API_FIELDS"
        :frozen-columns="['name']"
        exportFileName="Network Lists"
        :csvMapper="csvMapper"
        :emptyBlock="{
          title: 'No network lists have been added',
          description:
            'Click the button below to add a network list based on ASNs, countries, or IP addresses.',
          createButtonLabel: 'Network List',
          createPagePath: 'network-lists/create',
          documentationService: documentationService
        }"
      />
    </template>
  </ContentBlock>
</template>
