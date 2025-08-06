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
  import { useEdgeSQLStatusManager } from '@/composables/use-edge-sql-status-manager'
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
    PENDING_STATUSES,
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

  const actions = [
    {
      type: 'delete',
      label: 'Delete',
      title: 'database',
      icon: 'pi pi-trash',
      service: async (databaseId, databaseData) => {
        const result = await edgeSQLService.deleteDatabase(databaseId)

        const databaseName = databaseData.name?.text || databaseData.name

        // Se é operação assíncrona, monitora via polling
        if (result._isAsyncOperation) {
          console.log(`[ListView] Starting async delete monitoring for database ${databaseId}`)
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
        // Para operações síncronas, DeleteDialog mostra toast automático com a string

        return result
      }
    }
  ]

  const handleLoadData = (event) => {
    hasContentToList.value = event

    if (event && fetchListRef.value?.data?.value && Array.isArray(fetchListRef.value.data.value)) {
      processLoadedData(fetchListRef.value.data.value)
    }
  }

  const processLoadedData = (databases) => {
    if (!Array.isArray(databases)) return

    databases.forEach((db) => {
      const statusContent = db.status?.content || db.status
      const databaseName = db.name?.text || db.name

      const isPendingStatus = PENDING_STATUSES.includes(statusContent)
      const isAlreadyMonitored = isDatabasePending(db.id)

      if (isPendingStatus && !isAlreadyMonitored) {
        if (statusContent === 'creating') {
          addCreateOperation(db.id, databaseName, (status, operation) => {
            if (status === 'failed') {
              toast.add({
                severity: 'error',
                summary: 'Creation Failed',
                detail: `Failed to create database "${databaseName}". ${operation.error || ''}`,
                life: 5000
              })
              reloadList()
            }
          })
        } else if (statusContent === 'deleting') {
          addDeleteOperation(db.id, databaseName, (status, operation) => {
            if (status === 'failed') {
              toast.add({
                severity: 'error',
                summary: 'Delete Failed',
                detail: `Failed to delete database "${databaseName}". ${operation.error || ''}`,
                life: 5000
              })
              reloadList()
            }
          })
        }
      }
    })
  }

  const handleTrackEvent = () => {
    tracker.product?.clickToCreate({
      productName: 'Database'
    })
  }

  const handleTrackEditEvent = (database) => {
    tracker.product?.clickToEdit({
      productName: 'Database'
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
    router.push(`/edge-sql/database/${database.id}`)
  }

  watch(
    () => route.path,
    (newPath, oldPath) => {
      if (oldPath?.includes('/edge-sql/create') && newPath === '/edge-sql') {
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
        header: 'Name',
        filterPath: 'name.text',
        type: 'component',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'text-with-tag'
          })
        }
      },
      {
        field: 'created_at',
        header: 'Created At'
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

  const DATABASE_API_FIELDS = ['id', 'name', 'status', 'created_at', 'last_modified']
</script>

<template>
  <ContentBlock data-testid="edge-sql-content-block">
    <template #heading>
      <PageHeadingBlock
        pageTitle="Edge SQL"
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
        createPagePath="/edge-sql/create"
        editPagePath="/edge-sql/database"
        :enableEditClick="false"
        :listService="edgeSQLService.listDatabases"
        :columns="getColumns"
        :apiFields="DATABASE_API_FIELDS"
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
        createPagePath="/edge-sql/create"
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
