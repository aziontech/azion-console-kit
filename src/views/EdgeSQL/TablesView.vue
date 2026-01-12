<template>
  <div class="flex sm:flex-row flex-col gap-8 mt-4">
    <ConfirmDialog />
    <TruncateTable
      v-model:visible="truncateTableVisible"
      :tables="selectedTableNames"
      @load-tables="emit('load-tables')"
    />
    <AlterColumn
      v-model:visible="alterColumnVisible"
      :query="alterColumnQuery"
      :tableName="selectedTable?.name"
      @load-tables="selectTable(selectedTable)"
    />
    <Menu
      ref="tableMenuRef"
      id="table_menu"
      :model="tableMenuItems"
      :popup="true"
      appendTo="body"
      class="w-fit"
      :pt="{
        menuitem: ({ context }) => ({
          'data-testid': `table-menu-item-${context.item?.label
            ?.toLowerCase()
            .replace(/\s+/g, '-')}`
        })
      }"
    />
    <ListTables
      class="sm:w-64 w-full sm:max-h-72 max-h-full"
      :listTables="props.listTables"
      :isLoading="props.isLoadTables"
      v-model:selectedTables="selectedTableNames"
      v-model:showCheckbox="isSelectionMode"
      @reload-tables="reloadTables"
      @create-table="createTable"
      @select-table="selectTable"
      @show-table-menu="showTableMenu"
      @open-confirm-truncate="openConfirmTruncate"
      @open-confirm-delete="openConfirmDelete"
    />
    <div class="w-full flex flex-col gap-4 overflow-hidden">
      <InlineMessage
        v-if="isApplyingChanges"
        severity="info"
        icon="pi pi-spin pi-spinner"
        data-testid="table-loading-message"
      >
        SQL requests are queued. The table will update automatically once processing is complete.
      </InlineMessage>
      <SqlDatabaseList
        :data="dataFiltered"
        :title="tableName"
        :isLoading="isLoadingQuery"
        :columns="tableColumns"
        :delete-service="deleteService"
        data-testid="table-list"
        @row-edit-saved="handleActionRowTable"
        @row-edit-cancel="onRowEditCancel"
        @reload-table="selectTable(selectedTable)"
        :disabled-action="isApplyingChanges"
        @view-change="handleViewChange"
        :title-delete-dialog="titleDeleteDialog"
        @click-to-create="createTable"
        :exportFileName="tableName || 'Table Data'"
        :empty-block="{
          title: 'No tables have been created',
          description: 'Create your first table to store your data at the edge.',
          createButtonLabel: 'Table'
        }"
        :not-show-empty-block="notShowEmptyBlock"
      >
      </SqlDatabaseList>
    </div>
  </div>
</template>
<script setup>
  defineOptions({ name: 'tables-view' })
  import { ref, computed, nextTick, watch, onMounted } from 'vue'
  import { useEdgeSQL } from './composable/useEdgeSQL'
  import InlineMessage from 'primevue/inlinemessage'
  import ConfirmDialog from 'primevue/confirmdialog'
  import TruncateTable from './Dialog/TruncateTable.vue'
  import AlterColumn from './Dialog/AlterColumn.vue'
  import { useDeleteDialog } from '@/composables/useDeleteDialog'
  import Menu from 'primevue/menu'
  import { edgeSQLService } from '@/services/v2/edge-sql/edge-sql-service'
  import { TableActionManager } from './utils/table-actions'
  import SqlDatabaseList from '@/templates/list-table-block/sql-database-list.vue'
  import { SQLITE_QUERIES } from './constants/queries'
  import ListTables from './components/ListTables.vue'
  import {
    createDeleteService,
    createInsertRowService,
    createUpdateRowService
  } from './utils/row-actions'
  const emit = defineEmits([
    'go-editor',
    'load-tables',
    'execute-query',
    'show-table-info',
    'show-definition'
  ])

  const props = defineProps({
    listTables: {
      type: Array,
      required: true
    },
    isLoadTables: {
      type: Boolean,
      required: true
    }
  })

  const { currentDatabase, executeQuery } = useEdgeSQL()
  const isSelectionMode = ref(false)
  const selectedTableNames = ref([])
  const tableMenuRef = ref(null)
  const selectedTable = ref(null)
  const truncateTableVisible = ref(false)
  const alterColumnVisible = ref(false)
  const alterColumnQuery = ref('')
  const columns = ref([])
  const tableRows = ref([])
  const isLoadingQuery = ref(false)
  const notShowEmptyBlock = ref(false)

  const resetTable = () => {
    selectedTable.value = null
    columns.value = []
    tableRows.value = []
    tableSchema.value = []
    isSelectionMode.value = false
    selectedTableNames.value = []
    notShowEmptyBlock.value = false
    tableMenuRef.value.hide()
  }

  const tableColumns = computed(() => {
    if (activeView.value === 'table') {
      return Array.isArray(columns.value) ? columns.value : []
    } else {
      return columnsSchema.value
    }
  })

  const titleDeleteDialog = computed(() => {
    if (activeView.value === 'table') {
      return 'Table'
    } else {
      return 'Column'
    }
  })

  const dataFiltered = computed(() => {
    if (activeView.value === 'table') {
      return tableRows.value
    } else {
      return tableSchema.value
    }
  })
  const tableSchema = ref([])
  const isApplyingChanges = ref(false)

  const activeView = ref('table')

  const handleViewChange = (event) => {
    if (!event) return
    activeView.value = event.value
  }

  const isColumnView = computed(() => activeView.value === 'schema')

  const { openDeleteDialog: openDeleteDialogComposable } = useDeleteDialog()

  const openConfirmTruncate = () => {
    truncateTableVisible.value = true
  }

  const deleteTableService = async () => {
    await edgeSQLService.executeDatabase(currentDatabase.value.id, {
      statements: selectedTableNames.value.map((tableName) => `DROP TABLE ${tableName};`)
    })

    const namesTablesDeleted = selectedTableNames.value.join(', ')
    selectedTableNames.value = []
    notShowEmptyBlock.value = false
    resetTable()
    emit('load-tables')
    return `Table "${namesTablesDeleted}" deleted successfully`
  }

  const createTable = () => {
    emit('go-editor')
  }

  const columnsSchema = ref([
    {
      field: 'name',
      header: 'Column Name'
    },
    {
      field: 'type',
      header: 'Data Type'
    },
    {
      field: 'default',
      header: 'Default'
    },
    {
      field: 'notNull',
      header: 'Nullable'
    },
    {
      field: 'primaryKey',
      header: 'Primary Key'
    }
  ])

  const insertColumnService = async (columnData) => {
    await edgeSQLService.insertColumn(currentDatabase.value.id, {
      tableName: selectedTable.value.name,
      columnData
    })
    await selectTable(selectedTable.value)
  }

  const handleActionRowSchema = (action) => {
    if (action.newData._isNew) {
      insertColumnService(action.newData)
    } else {
      openAlterColumnDialog(action.newData, action.oldData)
    }
  }

  const openAlterColumnDialog = (newData, oldData) => {
    if (!selectedTable.value?.name) return
    const sql = SQLITE_QUERIES.ALTER_COLUMN(
      selectedTable.value.name,
      tableSchema.value,
      oldData,
      newData
    )
    alterColumnQuery.value = sql
    alterColumnVisible.value = true
  }

  const handleActionRowTable = (action) => {
    if (activeView.value === 'table') {
      handleActionRow(action)
    } else {
      handleActionRowSchema(action)
    }
  }

  const handleActionRow = async (row) => {
    if (row.newData._isNew) {
      await onRowInsert(row.newData)
    } else {
      await onRowEditSave(row.newData, row.oldData)
    }
  }

  const deleteService = createDeleteService(
    (stmts) => executeQuery(stmts, { addToHistory: false }),
    () => selectedTable.value.name,
    () => tableSchema.value,
    () => selectTable(selectedTable.value),
    () => (isColumnView.value ? 'column' : 'row')
  )

  const insertRowService = createInsertRowService(
    (databaseId, payload) => edgeSQLService.insertRow(databaseId, payload),
    () => currentDatabase.value.id,
    () => selectedTable.value.name,
    () => tableSchema.value,
    () => selectTable(selectedTable.value)
  )

  const onRowInsert = async (row) => {
    try {
      isApplyingChanges.value = true
      await insertRowService(row)
    } finally {
      isApplyingChanges.value = false
    }
  }

  const updateRowService = createUpdateRowService(
    (databaseId, payload) => edgeSQLService.updatedRow(databaseId, payload),
    () => currentDatabase.value.id,
    () => selectedTable.value.name,
    () => tableSchema.value,
    () => selectTable(selectedTable.value)
  )

  const onRowEditSave = async (newData, whereData) => {
    isApplyingChanges.value = true
    try {
      await updateRowService(newData, whereData)
    } finally {
      isApplyingChanges.value = false
    }
  }

  const onRowEditCancel = () => {}

  const selectTable = async (table) => {
    isLoadingQuery.value = true
    selectedTable.value = table
    notShowEmptyBlock.value = true
    try {
      const result = await edgeSQLService.getTableInfo(currentDatabase.value.id, table.name)
      columns.value = result.body.tableSchema.map(({ name, type }) => ({
        field: name,
        tagType: type?.toLowerCase?.() ?? String(type || ''),
        header: name,
        sortable: true
      }))

      tableRows.value = result.body.rows
      tableSchema.value = result.body.tableSchema
    } finally {
      isLoadingQuery.value = false
    }
  }

  const tableName = computed(() => selectedTable.value?.name)

  const reloadTables = () => {
    emit('load-tables')
  }

  onMounted(() => {
    reloadTables()
  })

  const showTableMenu = (event, table) => {
    selectedTable.value = table
    const menu = tableMenuRef.value
    if (!menu) return
    if (menu.overlayVisible) {
      menu.hide()
    }
    nextTick(() => {
      menu.show(event)
    })
  }

  // When any checkbox is selected via hover state, enter selection mode permanently
  watch(
    selectedTableNames,
    (list) => {
      if (Array.isArray(list)) {
        isSelectionMode.value = !!list.length
      }
    },
    { deep: true }
  )

  // Bridge functions/refs for TableActionManager
  const activeTabIndex = ref(0)
  const isEditorCollapsed = ref(false)
  const sqlQueryRef = ref('')

  const executeQueryFn = async () => emit('execute-query', sqlQueryRef.value)

  const showDrawerFn = {
    showTableInfo: (tableName) => emit('show-table-info', tableName),
    showDefinition: (tableName) => emit('show-definition', tableName)
  }

  const deleteDialogFn = (tableName) => {
    // Use the same delete dialog flow as the bulk action
    selectedTableNames.value = [tableName]
    openDeleteDialogComposable({
      title: 'Table',
      message: `Delete 1 selected table(s)?`,
      icon: 'pi pi-exclamation-triangle',
      rejectLabel: 'Cancel',
      acceptLabel: 'Delete',
      acceptClass: 'p-button-danger',
      deleteService: deleteTableService,
      successCallback: () => emit('load-tables')
    })
  }

  const truncateDialogFn = (tableName) => {
    // Reuse the same truncate modal flow used in the toolbar
    selectedTableNames.value = [tableName]
    truncateTableVisible.value = true
  }

  const tableActionManager = new TableActionManager(
    executeQueryFn,
    showDrawerFn,
    activeTabIndex,
    isEditorCollapsed,
    sqlQueryRef,
    deleteDialogFn,
    truncateDialogFn
  )

  const tableMenuItems = computed(() => {
    if (!selectedTable.value) return []
    const menuTableName =
      selectedTable.value?.name || selectedTable.value?.label || selectedTable.value?.key
    return tableActionManager.generateMenuItems(menuTableName)
  })

  const openConfirmDelete = () => {
    if (!selectedTableNames.value.length) return
    openDeleteDialogComposable({
      title: `${selectedTableNames.value.length === 1 ? 'Table' : 'Tables'}`,
      message: `Delete ${selectedTableNames.value.length} selected table(s)?`,
      icon: 'pi pi-exclamation-triangle',
      rejectLabel: 'Cancel',
      acceptLabel: 'Delete',
      acceptClass: 'p-button-danger',
      deleteService: deleteTableService
    })
  }
</script>
