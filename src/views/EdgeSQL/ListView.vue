<script setup>
  import { computed, inject, ref, watch, onUnmounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'

  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import PageHeadingBlock from '@/templates/page-heading-block'

  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { useToast } from 'primevue/usetoast'
  import { edgeSQLService } from '@/services/v2'
  import { useEdgeSQLStore } from '@/stores/edge-sql'
  import { useEdgeSQLStatusManager } from './hooks'
  import { getStatusContent, getDatabaseName, isPendingStatus } from './utils'
  import OperationQueueStatus from './components/OperationQueueStatus.vue'

  defineOptions({ name: 'list-edge-sql-databases' })

  const tracker = inject('tracker')
  const router = useRouter()
  const route = useRoute()
  const toast = useToast()
  const sqlStore = useEdgeSQLStore()

  const {
    isProcessing,
    isEmpty,
    stats,
    addCreateOperation,
    addDeleteOperation,
    isDatabasePending,
    onGlobalEvent
  } = useEdgeSQLStatusManager()

  const props = defineProps({
    documentationService: {
      required: true,
      type: Function
    }
  })

  const hasContentToList = ref(true)
  const fetchListRef = ref(null)

  const reloadList = () => {
    if (fetchListRef.value?.reload) {
      fetchListRef.value.reload()
    }
  }

  const removeGlobalListener = onGlobalEvent('operationCompleted', () => {
    setTimeout(reloadList, 200)
  })

  const deleteDatabaseService = async (databaseId, databaseData) => {
    const result = await edgeSQLService.deleteDatabase(databaseId)
    const databaseName = databaseData.name?.text || databaseData.name
    const isAsyncOperation = typeof result === 'string' && result.includes('initiated')

    if (isAsyncOperation) {
      addDeleteOperation(databaseId, databaseName, (status, operation) => {
        if (status === 'failed') {
          toast.add({
            severity: 'error',
            summary: 'Delete Failed',
            detail: `Failed to delete database "${databaseName}". ${operation.error || ''}`,
            life: 5000
          })
          reloadList()
        } else if (status === 'deleted') {
          toast.add({
            severity: 'success',
            summary: 'Delete Completed',
            detail: `Database "${databaseName}" has been successfully deleted.`,
            life: 4000
          })
          reloadList()
        }
      })
    }

    return result
  }

  const actions = [
    {
      type: 'delete',
      label: 'Delete',
      title: 'database',
      icon: 'pi pi-trash',
      service: deleteDatabaseService
    }
  ]

  const handleLoadData = (event) => {
    hasContentToList.value = event

    if (event && fetchListRef.value?.data?.value && Array.isArray(fetchListRef.value.data.value)) {
      processLoadedData(fetchListRef.value.data.value)
    }
  }

  const shouldMonitorDatabase = (db) => {
    const statusContent = getStatusContent(db)
    const isPending = isPendingStatus(statusContent)
    const isAlreadyMonitored = isDatabasePending(db.id)
    return isPending && !isAlreadyMonitored
  }

  const createOperationCallback = (databaseName) => (status, operation) => {
    if (status === 'failed') {
      toast.add({
        severity: 'error',
        summary: 'Creation Failed',
        detail: `Failed to create database "${databaseName}". ${operation.error || ''}`,
        life: 5000
      })
      reloadList()
    }
  }

  const deleteOperationCallback = (databaseName) => (status, operation) => {
    if (status === 'failed') {
      toast.add({
        severity: 'error',
        summary: 'Delete Failed',
        detail: `Failed to delete database "${databaseName}". ${operation.error || ''}`,
        life: 5000
      })
      reloadList()
    }
  }

  const addDatabaseOperation = (db) => {
    const statusContent = getStatusContent(db)
    const databaseName = getDatabaseName(db)

    if (statusContent === 'creating') {
      addCreateOperation(db.id, databaseName, createOperationCallback(databaseName))
    } else if (statusContent === 'deleting') {
      addDeleteOperation(db.id, databaseName, deleteOperationCallback(databaseName))
    }
  }

  const processLoadedData = (databases) => {
    if (!Array.isArray(databases)) return

    databases.forEach((db) => {
      if (shouldMonitorDatabase(db)) {
        addDatabaseOperation(db)
      }
    })
  }

  const handleTrackEvent = () => {
    tracker.product?.clickToCreate({
      productName: 'Edge SQL Database'
    })
  }

  const handleTrackEditEvent = (database) => {
    tracker.product?.clickToEdit({
      productName: 'Edge SQL Database'
    })

    const statusContent = database.status?.content || database.status

    if (statusContent === 'creating') {
      toast.add({
        severity: 'warn',
        summary: 'Database not ready',
        detail: 'Please wait for the database creation to complete before accessing it.',
        life: 4000
      })
      return
    }

    if (statusContent !== 'created' && statusContent !== 'ready') {
      toast.add({
        severity: 'error',
        summary: 'Database unavailable',
        detail: 'This database is not available for queries at the moment.',
        life: 4000
      })
      return
    }

    sqlStore.setCurrentDatabase(database)
    router.push(`/sql-database/database/${database.id}`)
  }

  watch(
    () => route.path,
    (newPath, oldPath) => {
      if (oldPath?.includes('/sql-database/create') && newPath === '/sql-database') {
        setTimeout(reloadList, 500)
      }
    },
    { immediate: true }
  )

  watch(
    () => fetchListRef.value?.data?.value,
    (newData, oldData) => {
      if (newData && Array.isArray(newData) && newData !== oldData) {
        processLoadedData(newData)
      }
    },
    { deep: true, immediate: true }
  )

  onUnmounted(() => {
    if (removeGlobalListener) {
      removeGlobalListener()
    }
  })

  const getQueueSummary = () => {
    const creating = stats.value.creating
    const deleting = stats.value.deleting
    const total = creating + deleting

    if (total === 0) {
      return {
        status: 'idle',
        icon: 'pi pi-check-circle',
        text: 'All operations complete',
        color: 'text-green-600',
        severity: 'success'
      }
    }

    if (isProcessing.value) {
      return {
        status: 'processing',
        icon: 'pi pi-spin pi-spinner',
        text: `Processing ${total} operation${total > 1 ? 's' : ''}...`,
        color: 'text-blue-600',
        severity: 'info'
      }
    }

    return {
      status: 'pending',
      icon: 'pi pi-clock',
      text: `${creating} creating, ${deleting} deleting`,
      color: 'text-yellow-600',
      severity: 'warning'
    }
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name'
      },
      {
        field: 'last_modified',
        header: 'Last Modified'
      },
      {
        field: 'status',
        header: 'Status',
        type: 'component',
        component: (columnData) => {
          const statusContent = columnData?.content || columnData
          let tagData = columnData

          if (statusContent === 'creating') {
            tagData = {
              content: 'Creating',
              severity: 'warning',
              icon: 'pi pi-spin pi-spinner'
            }
          } else if (statusContent === 'created' || statusContent === 'ready') {
            tagData = {
              content: 'Ready',
              severity: 'success',
              icon: 'pi pi-check'
            }
          } else if (statusContent === 'deleting') {
            tagData = {
              content: 'Deleting',
              severity: 'danger',
              icon: 'pi pi-spin pi-spinner'
            }
          } else {
            tagData = {
              content: statusContent || 'Unknown',
              severity: 'secondary',
              icon: 'pi pi-exclamation-triangle'
            }
          }

          return columnBuilder({
            data: tagData,
            columnAppearance: 'tag'
          })
        }
      }
    ]
  })

  const EDGE_SQL_API_FIELDS = ['id', 'name', 'status', 'active', 'last_modified']
</script>

<template>
  <ContentBlock data-testid="edge-sql-content-block">
    <template #heading>
      <PageHeadingBlock
        pageTitle="SQL Database"
        data-testid="edge-sql-heading"
      >
        <template #actions>
          <div class="flex items-center gap-3">
            <OperationQueueStatus
              :stats="stats"
              :isProcessing="isProcessing"
              :isEmpty="isEmpty"
              :queueSummary="getQueueSummary()"
            />
          </div>
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <FetchListTableBlock
        v-if="hasContentToList"
        ref="fetchListRef"
        addButtonLabel="Database"
        createPagePath="/sql-database/create"
        editPagePath="/sql-database/database"
        :enableEditClick="false"
        :listService="edgeSQLService.listDatabases"
        :columns="getColumns"
        :apiFields="EDGE_SQL_API_FIELDS"
        @on-load-data="handleLoadData"
        @on-before-go-to-add-page="handleTrackEvent"
        @on-before-go-to-edit="handleTrackEditEvent"
        emptyListMessage="No databases found."
        data-testid="edge-sql-list-table-block"
        :actions="actions"
        :defaultOrderingFieldName="'name'"
      />
      <EmptyResultsBlock
        v-else
        title="No databases have been created"
        description="Create your first SQL database to store and query your data at the edge."
        createButtonLabel="Database"
        createPagePath="/sql-database/create"
        :documentationService="props.documentationService"
        data-testid="edge-sql-empty-results-block"
      >
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>
