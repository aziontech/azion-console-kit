<script setup>
  import { computed, inject } from 'vue'
  import ContentBlock from '@/templates/content-block'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { networkListsService } from '@/services/v2/network-lists/network-lists-service'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { DataTableActionsButtons } from '@/components/DataTable'

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
      label: 'Delete',
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
        style: 'max-width: 300px',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'text-format-with-popup'
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
      },
      {
        field: 'lastEditor',
        header: 'Last Editor',
        sortField: 'last_editor',
        filterPath: 'last_editor'
      },
      {
        field: 'lastModified',
        header: 'Last Modified',
        sortField: 'lastModified',
        filterPath: 'lastModified'
      }
    ]
  })

  const allowedFilters = [
    {
      header: 'Name',
      field: 'name'
    },
    {
      header: 'ID',
      field: 'id'
    }
  ]
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Network Lists"
        description="Define and manage lists of IP addresses and CIDR ranges used by security and traffic controls."
      >
        <template #default>
          <DataTableActionsButtons
            size="small"
            label="Network List"
            createPagePath="network-lists/create"
            @click="handleCreateTrackEvent"
            data-testid="create_NetworkList_button"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <FetchListTableBlock
        :listService="networkListsService.listNetworkLists"
        :columns="getColumns"
        editPagePath="/network-lists/edit"
        @on-before-go-to-edit="handleTrackEditEvent"
        emptyListMessage="No network lists found."
        :actions="actions"
        :apiFields="NETWORK_LIST_API_FIELDS"
        :frozen-columns="['name']"
        exportFileName="Network Lists"
        :csvMapper="csvMapper"
        :allowedFilters="allowedFilters"
        defaultOrderingFieldName="-last_modified"
        :emptyBlock="{
          title: 'No Network Lists yet',
          description:
            'Create your first WAF rule to inspect and control incoming requests.',
          createButtonLabel: 'Network List',
          createPagePath: 'network-lists/create',
          documentationService: documentationService
        }"
      />
    </template>
  </ContentBlock>
</template>
