<template>
  <div class="flex gap-8 mt-4">
    <ConfirmDialog />
    <TruncateTable
      v-model:visible="truncateTableVisible"
      :tables="selectedTables"
      @load-tables="emit('load-tables')"
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
    <div class="sm:w-64 w-full">
      <div
        class="flex justify-between items-center w-64"
        v-if="!showCheckbox"
      >
        <h3 class="text-lg font-normal text-color-primary">Tables</h3>

        <div class="flex gap-2">
          <PrimeButton
            icon="pi pi-refresh"
            size="small"
            outlined
            @click="reloadTables"
            data-testid="reload-table-button"
            class="w-8 h-8 p-0 flex items-center justify-center"
          />
          <PrimeButton
            icon="pi pi-plus"
            size="small"
            outlined
            @click="createTable"
            data-testid="create-table-button"
            class="w-8 h-8 p-0 flex items-center justify-center"
          />
        </div>
      </div>
      <div
        class="flex justify-between items-center w-64"
        v-else
      >
        <div class="flex gap-2 items-center">
          <PrimeButton
            icon="pi pi-times"
            size="small"
            outlined
            v-tooltip.top="{
              value: 'Cancel'
            }"
            @click="closeCheckbox"
            data-testid="cancel-table-button"
            class="w-8 h-8 p-0 flex items-center justify-center"
          />
          <span class="text-color-secondary">{{ selectedTables.length }} itens selected</span>
        </div>
        <div class="flex gap-2">
          <PrimeButton
            icon="ai ai-scizors"
            size="small"
            outlined
            v-tooltip.top="{
              value: 'Truncate'
            }"
            @click="openConfirmTruncate"
            data-testid="truncate-table-button"
            class="w-8 h-8 p-0 flex items-center justify-center"
          />
          <PrimeButton
            icon="pi pi-trash"
            size="small"
            v-tooltip.top="{
              value: 'Delete'
            }"
            @click="openConfirmDelete"
            severity="danger"
            data-testid="delete-table-button"
            class="w-8 h-8 p-0 flex items-center justify-center"
          />
        </div>
      </div>

      <div class="p-input-icon-left w-full mt-4">
        <i class="pi pi-search" />
        <InputText
          v-model="searchTerm"
          placeholder="Search tables"
          class="w-full"
        />
      </div>

      <div class="flex-1 overflow-y-auto max-h-[calc(100svh-40%)]">
        <div
          v-if="isLoading"
          class="flex flex-col gap-3"
        >
          <div
            v-for="index in 3"
            :key="index"
            class="py-2 rounded"
          >
            <div class="flex items-center justify-between">
              <Skeleton class="h-8 w-full" />
            </div>
          </div>
        </div>
        <div
          v-else-if="!filteredTables.length"
          class="text-left py-2"
        >
          <div class="text-color-secondary text-sm">
            {{ searchTerm ? 'No tables found.' : 'No tables created yet.' }}
          </div>
        </div>
        <div
          v-else
          class="mt-4"
        >
          <div
            v-for="table in filteredTables"
            :key="table.id"
            class="group p-2 rounded cursor-pointer hover:bg-[--table-bg-color] transition-colors"
            @click="selectTable(table)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i
                  class="ai ai-datasheet group-hover:hidden"
                  @click.stop="showCheckboxAndSelectTable(table)"
                  v-show="!showCheckbox"
                />
                <Checkbox
                  v-model="selectedTables"
                  :value="table.name"
                  :class="showCheckbox ? 'inline-flex' : 'hidden group-hover:inline-flex'"
                />
                <span class="text-sm font-medium text-color-primary truncate">{{
                  table.name
                }}</span>
              </div>

              <PrimeButton
                icon="pi pi-ellipsis-h"
                size="small"
                outlined
                @click.stop="showTableMenu($event, table)"
                data-testid="table-menu-button"
                class="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="w-full flex flex-col gap-4">
      <InlineMessage
        v-if="isLoadChanges"
        severity="info"
        icon="pi pi-spin pi-spinner"
        data-testid="table-loading-message"
      >
        SQL requests are queued. The table will update automatically once processing is complete.
      </InlineMessage>
      <SqlDatabaseList
        :data="dataFiltered"
        :title="tableName"
        :columns="tableColumns"
        data-testid="table-list"
        @row-click="onRowClick"
        @row-edit-saved="handleActionRowTable"
        @row-edit-cancel="onRowEditCancel"
        :disabled-action="isLoadChanges"
        @view-change="onViewChange"
      >
      </SqlDatabaseList>
    </div>
  </div>
</template>
<script setup>
  defineOptions({ name: 'tables-view' })
  import { ref, computed, nextTick, watch } from 'vue'
  import Skeleton from 'primevue/skeleton'
  import InputText from 'primevue/inputtext'
  import PrimeButton from 'primevue/button'
  import { useEdgeSQL } from './composable/useEdgeSQL'
  import InlineMessage from 'primevue/inlinemessage'
  import Checkbox from 'primevue/checkbox'
  import ConfirmDialog from 'primevue/confirmdialog'
  import TruncateTable from './Dialog/TruncateTable.vue'
  import { useDeleteDialog } from '@/composables/useDeleteDialog'
  import Menu from 'primevue/menu'
  import { edgeSQLService } from '@/services/v2/edge-sql/edge-sql-service'
  import { TableActionManager } from './utils/table-actions'
  import SqlDatabaseList from '@/templates/list-table-block/sql-database-list.vue'

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

  const { currentDatabase } = useEdgeSQL()
  const showCheckbox = ref(false)
  const selectedTables = ref([])
  const tableMenuRef = ref(null)
  const selectedTable = ref(null)
  const truncateTableVisible = ref(false)
  const columns = ref([])
  const dataTable = ref([])
  const tableColumns = computed(() => {
    if (viewChange.value === 'table') {
      return Array.isArray(columns.value) ? columns.value : []
    } else {
      return columnsSchema.value
    }
  })

  const dataFiltered = computed(() => {
    if (viewChange.value === 'table') {
      return dataTable.value
    } else {
      return tableSchema.value
    }
  })
  const tableSchema = ref([])
  const isLoadChanges = ref(false)

  const viewChange = ref('table')

  const onViewChange = (event) => {
    viewChange.value = event.value.value
  }

  const { openDeleteDialog: openDeleteDialogComposable } = useDeleteDialog()

  const openConfirmTruncate = () => {
    truncateTableVisible.value = true
  }

  const deleteTableService = async () => {
    await edgeSQLService.executeDatabase(currentDatabase.value.id, {
      statements: selectedTables.value.map((tableName) => `DROP TABLE ${tableName};`)
    })

    const namesTablesDeleted = selectedTables.value.join(', ')
    selectedTables.value = []
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
    }
  ])

  const filterValidSchemaKeys = (obj, schemaKeys) => {
    const allowedKeys = schemaKeys.map((key) => key.name)
    const filteredObj = {}

    Object.keys(obj).forEach((key) => {
      if (allowedKeys.includes(key)) {
        filteredObj[key] = obj[key]
      }
    })

    return filteredObj
  }

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
      updateColumnService(action.newData, action.oldData)
    }
  }

  const updateColumnService = async (newData, oldData) => {
    await edgeSQLService.updateColumn(currentDatabase.value.id, {
      tableName: selectedTable.value.name,
      columnData: newData,
      oldColumnData: oldData
    })

    await selectTable(selectedTable.value)
  }

  const handleActionRowTable = (action) => {
    if (viewChange.value === 'table') {
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

  const onRowInsert = async (row) => {
    const filteredData = filterValidSchemaKeys(row, tableSchema.value)

    try {
      isLoadChanges.value = true
      await edgeSQLService.insertRow(currentDatabase.value.id, {
        tableName: selectedTable.value.name,
        dataToInsert: filteredData,
        tableSchema: tableSchema.value
      })
      await selectTable(selectedTable.value)
    } finally {
      isLoadChanges.value = false
    }
  }

  const onRowEditSave = async (newData, whereData) => {
    isLoadChanges.value = true
    const filteredNewData = filterValidSchemaKeys(newData, tableSchema.value)
    const filteredWhereData = filterValidSchemaKeys(whereData, tableSchema.value)

    try {
      await edgeSQLService.updatedRow(currentDatabase.value.id, {
        tableName: selectedTable.value.name,
        newData: filteredNewData,
        whereData: filteredWhereData,
        tableSchema: tableSchema.value
      })
    } finally {
      await selectTable(selectedTable.value)
      isLoadChanges.value = false
    }
  }

  const onRowEditCancel = () => {}

  const selectTable = async (table) => {
    selectedTable.value = table
    const result = await edgeSQLService.getTableInfo(currentDatabase.value.id, table.name)
    columns.value = result.body.columns.map(({ columns }) => ({
      field: columns.name,
      tagType: columns.type?.toLowerCase?.() ?? String(columns.type || ''),
      header: columns.name,
      sortable: true
    }))

    dataTable.value = result.body.rows
    tableSchema.value = result.body.tableSchema
  }

  const tableName = computed(() => selectedTable.value?.name)

  const reloadTables = () => {
    emit('load-tables')
  }

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
    selectedTables,
    (list) => {
      if (Array.isArray(list)) {
        showCheckbox.value = !!list.length
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
    selectedTables.value = [tableName]
    openDeleteDialogComposable({
      title: 'Table',
      message: `Delete 1 selected table(s)?`,
      icon: 'pi pi-exclamation-triangle',
      rejectLabel: 'Cancel',
      acceptLabel: 'Delete',
      acceptClass: 'p-button-danger',
      deleteService: deleteTableService
    })
  }

  const truncateDialogFn = (tableName) => {
    // Reuse the same truncate modal flow used in the toolbar
    selectedTables.value = [tableName]
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

  const showCheckboxAndSelectTable = (table) => {
    showCheckbox.value = true
    selectedTables.value.push(table.name)
  }

  const closeCheckbox = () => {
    showCheckbox.value = false
    selectedTables.value = []
  }

  const openConfirmDelete = () => {
    if (!selectedTables.value.length) return
    openDeleteDialogComposable({
      title: `${selectedTables.value.length === 1 ? 'Table' : 'Tables'}`,
      message: `Delete ${selectedTables.value.length} selected table(s)?`,
      icon: 'pi pi-exclamation-triangle',
      rejectLabel: 'Cancel',
      acceptLabel: 'Delete',
      acceptClass: 'p-button-danger',
      deleteService: deleteTableService
    })
  }

  const searchTerm = ref('')
  const isLoading = computed(() => props.isLoadTables)
  const onRowClick = (event) => {
    const row = event?.data || event
    if (row) selectTable(row)
  }
  const filteredTables = computed(() => {
    const list = Array.isArray(props.listTables) ? props.listTables : []
    const term = (searchTerm.value || '').toString().toLowerCase()
    if (!term) return list
    return list.filter((table) => {
      const raw = table?.name ?? ''
      const label = raw != null ? raw.toString().toLowerCase() : ''
      return label.includes(term)
    })
  })
</script>
