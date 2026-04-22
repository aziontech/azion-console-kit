<script setup>
  import { computed, inject, ref, watch, onUnmounted } from 'vue'
  import { useRouter } from 'vue-router'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import { edgeSQLService } from '@/services/v2/edge-sql/edge-sql-service'
  import { useEdgeSQL } from './composable/useEdgeSQL'
  import * as Helpers from '@/helpers'
  import ListTable from '@/components/list-table'
  import { DataTableActionsButtons } from '@/components/list-table'

  defineOptions({ name: 'list-edge-sql-databases' })

  const tracker = inject('tracker')
  const router = useRouter()
  const { databaseCreated, setCurrentDatabase, setDatabaseCreated } = useEdgeSQL()

  const handleNavigateToCreate = () => {
    router.push('/sql-database/create')
  }

  const listTableRef = ref()
  const pollingInterval = ref(null)
  const deletePollingInterval = ref(null)
  const isPollingLoading = ref(false)
  const isDeleting = ref(false)
  const databaseDeleted = ref(null)

  const EDGE_SQL_API_FIELDS = ['id', 'name', 'status', 'active', 'last_modified', 'last_editor']

  const checkDatabaseStatus = async (databaseId) => {
    const result = await edgeSQLService.checkDatabaseStatus(databaseId, 'id,name,status')
    return result.body.status
  }

  const reload = () => {
    listTableRef.value?.reload?.()
  }

  const startPolling = (databaseId) => {
    if (pollingInterval.value) clearInterval(pollingInterval.value)

    pollingInterval.value = setInterval(async () => {
      const status = await checkDatabaseStatus(databaseId)

      if (status === 'created' || status === 'ready') {
        stopPolling()
        setDatabaseCreated(null)
        reload()
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
        reload()
      }
    }, 3000)
  }

  const stopPolling = () => {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value)
      pollingInterval.value = null
    }
    isPollingLoading.value = false
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
        isPollingLoading.value = true
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
    () => listTableRef.value?.dataTableRef?.data,
    (data) => {
      if (!data) return
      const creatingDatabases = data.filter((database) => database.status?.content === 'creating')
      creatingDatabases.forEach((database) => {
        startPolling(database.id)
      })
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
        description="Deploy and manage SQL Databases to store and query structured relational data."
      >
        <template #default>
          <DataTableActionsButtons
            size="small"
            label="SQL Database"
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
        v-if="isPollingLoading || isDeleting"
      >
        Database requests are queued. The table will update automatically once processing is
        complete.
      </InlineMessage>
      <ListTable
        ref="listTableRef"
        :listService="edgeSQLService.listDatabases"
        :columns="getColumns"
        :actions="actions"
        editPagePath="/sql-database/database"
        :enableEditClick="false"
        defaultOrderingFieldName="name"
        exportFileName="SQL Database"
        :csvMapper="csvMapper"
        :apiFields="EDGE_SQL_API_FIELDS"
        :lazy="true"
        :frozenColumns="['name']"
        :emptyBlock="{
          title: 'No SQL Databases yet',
          description: 'Create your first database to store relational data and run SQL queries.',
          createButtonLabel: 'SQL Database',
          documentationService: Helpers.documentationGuideProducts.edgeSQL
        }"
        @click-to-create="handleNavigateToCreate"
        @on-before-go-to-add-page="handleTrackEvent"
        @on-before-go-to-edit="handleTrackEditEvent"
      />
    </template>
  </ContentBlock>
</template>
