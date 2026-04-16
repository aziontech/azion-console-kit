<script setup>
  import { computed, inject, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import ListTable from '@/components/list-table'
  import { DataTableActionsButtons } from '@/components/list-table'
  import { networkListsService } from '@/services/v2/network-lists/network-lists-service'

  defineOptions({ name: 'network-list-view' })

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineProps({
    documentationService: {
      required: true,
      type: Function
    }
  })

  const router = useRouter()
  const NETWORK_LIST_API_FIELDS = ['id', 'name', 'type', 'last_editor', 'last_modified']

  const listTableRef = ref()

  const handleNavigateToCreate = () => {
    router.push('network-lists/create')
  }

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

  const emit = defineEmits(['on-load-data', 'on-before-go-to-edit'])
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
      <ListTable
        ref="listTableRef"
        :listService="networkListsService.listNetworkLists"
        :columns="getColumns"
        :actions="actions"
        editPagePath="/network-lists/edit"
        :apiFields="NETWORK_LIST_API_FIELDS"
        defaultOrderingFieldName="-last_modified"
        :frozenColumns="['name']"
        exportFileName="Network Lists"
        :csvMapper="csvMapper"
        :lazy="true"
        emptyListMessage="No network lists found."
        :allowedFilters="allowedFilters"
        :emptyBlock="{
          title: 'No Network Lists yet',
          description: 'Create your first network list to control traffic and security behavior.',
          createButtonLabel: 'Network List',
          documentationService: documentationService
        }"
        @click-to-create="handleNavigateToCreate"
        @on-load-data="emit('on-load-data', $event)"
        @on-before-go-to-edit="handleTrackEditEvent"
      />
    </template>
  </ContentBlock>
</template>
