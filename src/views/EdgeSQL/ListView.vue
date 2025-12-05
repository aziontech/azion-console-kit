<script setup>
  import { computed, inject, ref, watch, onUnmounted } from 'vue'
  import { useRouter } from 'vue-router'

  import ContentBlock from '@/templates/content-block'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import InlineMessage from 'primevue/inlinemessage'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { edgeSQLService } from '@/services/v2/edge-sql/edge-sql-service'
  import { useEdgeSQL } from './composable/useEdgeSQL'
  import * as Helpers from '@/helpers'
  import { DataTableActionsButtons } from '@/components/DataTable'

  defineOptions({ name: 'list-edge-sql-databases' })

  const tracker = inject('tracker')
  const router = useRouter()
  const { databaseCreated, setCurrentDatabase, setDatabaseCreated } = useEdgeSQL()

  const hasContentToList = ref(true)
  const fetchListRef = ref(null)
  const pollingInterval = ref(null)
  const deletePollingInterval = ref(null)
  const isLoading = ref(false)
  const isDeleting = ref(false)
  const databaseDeleted = ref(null)

  const EDGE_SQL_API_FIELDS = ['id', 'name', 'status', 'active', 'last_modified', 'last_editor']

  const reloadList = () => {
    fetchListRef.value?.reload?.()
  }

  const checkDatabaseStatus = async (databaseId) => {
    const result = await edgeSQLService.checkDatabaseStatus(databaseId, 'id,name,status')
    return result.body.status
  }

  const startPolling = (databaseId) => {
    if (pollingInterval.value) clearInterval(pollingInterval.value)

    pollingInterval.value = setInterval(async () => {
      const status = await checkDatabaseStatus(databaseId)

      if (status === 'created' || status === 'ready') {
        stopPolling()
        setDatabaseCreated(null)
        reloadList()
      } else if (status === 'failed' || status === 'error') {
        stopPolling()
        setDatabaseCreated(null)
      }
    }, 3000)
  }

  const startDeletePolling = (databaseId) => {
    if (deletePollingInterval.value) clearInterval(deletePollingInterval.value)

    deletePollingInterval.value = setInterval(async () => {
      try {
        await checkDatabaseStatus(databaseId)
      } catch (error) {
        stopDeletePolling()
        databaseDeleted.value = null
        reloadList()
      }
    }, 3000)
  }

  const stopPolling = () => {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value)
      pollingInterval.value = null
    }
    isLoading.value = false
  }

  const stopDeletePolling = () => {
    if (deletePollingInterval.value) {
      clearInterval(deletePollingInterval.value)
      deletePollingInterval.value = null
    }
    isDeleting.value = false
  }

  const deleteDatabase = async (databaseId) => {
    const response = await edgeSQLService.deleteDatabase(databaseId)
    databaseDeleted.value = databaseId
    return response
  }

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const handleTrackEvent = () => {
    tracker.product?.clickToCreate({ productName: 'Edge SQL Database' })
  }

  const handleTrackEditEvent = (database) => {
    tracker.product?.clickToEdit({ productName: 'Edge SQL Database' })
    setCurrentDatabase(database)
    router.push(`/sql-database/database/${database.id}`)
  }

  const csvMapper = (rowData) => {
    return {
      name: rowData.name,
      lastEditor: rowData.lastEditor,
      lastModified: rowData.lastModified,
      status: rowData.data?.content
    }
  }

  const getColumns = computed(() => [
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
      field: 'status',
      header: 'Status',
      type: 'component',
      component: (columnData) =>
        columnBuilder({
          data: columnData,
          columnAppearance: 'tag'
        })
    },
    {
      field: 'last_modified',
      header: 'Last Modified',
      sortField: 'last_modified',
      filterPath: 'last_modified',
      type: 'component',
      component: (columnData, rowData, dependencies) => {
        return columnBuilder({
          data: rowData,
          columnAppearance: 'last-modified',
          dependencies
        })
      }
    }
  ])

  const actions = [
    {
      type: 'delete',
      label: 'Delete',
      title: 'database',
      icon: 'pi pi-trash',
      service: deleteDatabase,
      disabled: (data) => {
        if (data.status.content === 'deleting' || data.status.content === 'creating') {
          return true
        }
        return false
      }
    }
  ]

  watch(
    databaseCreated,
    (newDatabase) => {
      if (newDatabase?.id) {
        isLoading.value = true
        startPolling(newDatabase.id)
      } else {
        stopPolling()
      }
    },
    { immediate: true }
  )

  watch(
    databaseDeleted,
    (deletedDatabase) => {
      if (deletedDatabase) {
        isDeleting.value = true
        startDeletePolling(deletedDatabase)
      } else {
        stopDeletePolling()
      }
    },
    { immediate: true }
  )

  watch(
    () => fetchListRef.value?.data,
    (data) => {
      if (Array.isArray(data) && data.length) {
        const databaseCreating = data.find((database) => {
          const statusContent =
            typeof database.status === 'string' ? database.status : database.status?.content
          return statusContent === 'creating'
        })

        if (databaseCreating?.id) {
          startPolling(databaseCreating.id)
        }
      }
    },
    { immediate: true }
  )

  onUnmounted(() => {
    stopPolling()
    stopDeletePolling()
  })
</script>

<template>
  <ContentBlock data-testid="edge-sql-content-block">
    <template #heading>
      <PageHeadingBlock
        pageTitle="SQL Database"
        data-testid="edge-sql-heading"
        description="Manage relational data with scalable and efficient SQL database solutions."
      >
        <template #default>
          <DataTableActionsButtons
            size="small"
            label="Database"
            @click="handleTrackEvent"
            createPagePath="/sql-database/create"
            data-testid="create_Database_button"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <InlineMessage
        class="w-fit mb-8"
        severity="info"
        icon="pi pi-spin pi-spinner"
        v-if="isLoading || isDeleting"
      >
        Database requests are queued. The table will update automatically once processing is
        complete.
      </InlineMessage>
      <FetchListTableBlock
        ref="fetchListRef"
        editPagePath="/sql-database/database"
        :enableEditClick="false"
        :listService="edgeSQLService.listDatabases"
        :columns="getColumns"
        :apiFields="EDGE_SQL_API_FIELDS"
        @on-load-data="handleLoadData"
        @on-before-go-to-add-page="handleTrackEvent"
        @on-before-go-to-edit="handleTrackEditEvent"
        emptyListMessage="No Databases found."
        data-testid="edge-sql-list-table-block"
        :actions="actions"
        :defaultOrderingFieldName="'name'"
        :frozen-columns="['name']"
        exportFileName="SQL Database"
        :csvMapper="csvMapper"
        :emptyBlock="{
          title: 'No Databases have been created',
          description: 'Create your first SQL Database to store and query your data at the edge.',
          createButtonLabel: 'Database',
          createPagePath: '/sql-database/create',
          documentationService: Helpers.documentationGuideProducts.edgeSQL
        }"
      />
    </template>
  </ContentBlock>
</template>
