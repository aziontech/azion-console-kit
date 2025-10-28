<template>
  <div class="sql-database-list w-full h-full flex flex-col min-h-0">
    <DataTable
      class="flex-1 min-h-0"
      :data="displayDataForView"
      :columns="props.columns"
      :loading="isLoading"
      v-model:filters="filters"
      v-model:sortField="sortFieldValue"
      v-model:sortOrder="sortOrderValue"
      editMode="row"
      v-model:editingRows="editingRows"
      @row-edit-save="onRowEditSave"
      @row-edit-cancel="onRowEditCancel"
      :paginator="true"
      :rowsPerPageOptions="[10, 25, 50, 100]"
      :rows="minimumOfItemsPerPage"
      @page="onPage"
      @sort="(e) => $emit('sort', e)"
      :first="firstItemIndex"
      :globalFilterFields="filterBy"
      removableSort
      scrollable
      scrollHeight="flex"
      :pt="{
        header: {
          class: 'bg-gray-50 text-gray-900'
        },
        headerContent: {
          class: 'flex items-center gap-2'
        },
        headerText: {
          class: 'text-left'
        },
        emptyMessage: {
          class: 'p-0 h-full'
        }
      }"
    >
      <template #header>
        <DataTable.Header>
          <div class="flex flex-col gap-2 w-full">
            <div class="flex items-center gap-2 justify-between">
              <div class="text-color text-lg font-medium">{{ props.title }}</div>

              <SplitButton
                icon="pi pi-plus"
                label="Insert"
                @click="insertRow"
                :model="items"
              />
            </div>
            <div class="flex items-center gap-2 justify-between">
              <div class="flex gap-2 items-center">
                <DataTable.Search
                  v-model="filters.global.value"
                  :debounce="500"
                  placeholder="Search..."
                  @input="handleSearchValue"
                  @search="fetchOnSearch"
                />
                <PrimeButton
                  label="Filter"
                  icon="pi pi-filter"
                  @click="toggleFilter"
                  outlined
                  size="small"
                />
              </div>
              <DataTable.Actions>
                <SelectButton
                  v-model="selectedView"
                  :options="options"
                  optionLabel="value"
                  dataKey="value"
                  aria-labelledby="custom"
                  @change="onViewChange"
                >
                  <template #option="slotProps">
                    <div class="flex items-center gap-2">
                      <i :class="slotProps.option.icon"></i>
                      <span>{{ slotProps.option.label }}</span>
                    </div>
                  </template>
                </SelectButton>
                <PrimeButton
                  icon="pi pi-refresh"
                  @click="reload"
                  outlined
                  iconOnly
                  v-tooltip="{
                    value: 'Reload',
                    position: 'bottom'
                  }"
                  size="small"
                />
                <DataTable.Export />
                <PrimeButton
                  icon="ai ai-column"
                  outlined
                  iconOnly
                  @click="toggleColumnSelector"
                  v-tooltip.left="{ value: 'Available Columns', showDelay: 200 }"
                  data-testid="data-table-actions-column-header-toggle-columns"
                />
                <OverlayPanel
                  ref="columnSelectorPanel"
                  :pt="{ content: { class: 'p-0' } }"
                  data-testid="data-table-actions-column-header-toggle-columns-panel"
                >
                  <Listbox
                    v-model="selectedColumns"
                    multiple
                    :options="[
                      {
                        label: 'Available Columns',
                        items: props.columns.filter((c) => c?.field !== 'actions')
                      }
                    ]"
                    class="hidden-columns-panel"
                    optionLabel="header"
                    optionGroupLabel="label"
                    optionGroupChildren="items"
                    data-testid="data-table-actions-column-header-toggle-columns-panel-listbox"
                  >
                    <template #optiongroup="slotProps">
                      <p class="text-sm font-medium">{{ slotProps.option.label }}</p>
                    </template>
                  </Listbox>
                </OverlayPanel>
              </DataTable.Actions>
            </div>
          </div>
        </DataTable.Header>
      </template>
      <template #empty>
        <div class="w-full h-full min-h-0 flex-1">
          <vue-monaco-editor
            v-if="selectedView?.value === 'json'"
            :value="jsonPreview"
            language="json"
            :options="monacoOptions"
            :theme="monacoTheme"
            class="w-full h-full"
          />
          <div
            v-else
            class="w-full h-full"
          ></div>
        </div>
      </template>
      <template v-if="selectedView?.value !== 'json'">
        <Column
          v-for="col in selectedColumns"
          :key="col.field"
          :field="col.field"
          :header="col.header"
          :style="col.style || 'width: 20%'"
          :sortable="col.sortable !== false"
          :sortField="col.sortField"
          :pt="{
            header: {
              class: 'bg-gray-50 text-gray-900'
            },
            headerContent: {
              class: 'flex items-center gap-2'
            },
            headerText: {
              class: 'hidden'
            }
          }"
        >
          <template #header>
            <span class="flex items-center gap-2 text-color">
              {{ col.header }}
              <span class="text-color-secondary font-mono text-xs">{{ col.tagType }}</span>
            </span>
          </template>
          <template #body="{ data, field }">
            <slot
              :name="`body-${col.field}`"
              :data="data"
              :field="field"
              :value="data[field]"
            >
              {{ data[field] }}
            </slot>
          </template>
          <template #editor="{ data, field }">
            <Dropdown
              v-if="isSchemaView && field === 'type'"
              v-model="data[field]"
              :options="dataTypeOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
              filter
            />
            <InputText
              v-else
              v-model="data[field]"
              class="w-full"
            />
          </template>
        </Column>
        <DataTable.Column header="Actions">
          <template #body="{ data, index }">
            <div
              v-if="isRowEditing(index)"
              class="flex gap-1 justify-end"
            >
              <PrimeButton
                :icon="`pi ${isLoadingEditRow ? 'pi-spin pi-spinner' : 'pi-check'}`"
                size="small"
                @click.stop="saveRowEdit(data, index)"
                outlined
                iconOnly
                data-testid="row-save-button"
                v-tooltip.top="'Save'"
                :disabled="isLoadingEditRow"
              />
              <PrimeButton
                icon="pi pi-times"
                size="small"
                severity="secondary"
                outlined
                iconOnly
                @click.stop="cancelRowEdit(data, index)"
                data-testid="row-cancel-button"
                v-tooltip.top="'Cancel'"
              />
            </div>
            <div
              v-else
              class="flex justify-end"
            >
              <PrimeButton
                icon="pi pi-ellipsis-h"
                size="small"
                :disabled="disabledAction"
                outlined
                @click.stop="showRowMenu($event, data)"
                class="w-8 h-8 p-0"
                data-testid="row-actions-menu-button"
              />
            </div>
          </template>
        </DataTable.Column>
      </template>
    </DataTable>
    <Menu
      ref="rowMenuRef"
      :model="computedMenuItems"
      :popup="true"
    />
  </div>
</template>

<script setup>
  import { ref, toRefs, watch, computed } from 'vue'
  import Column from 'primevue/column'
  import PrimeButton from 'primevue/button'
  import SplitButton from 'primevue/splitbutton'
  import SelectButton from 'primevue/selectbutton'
  import OverlayPanel from 'primevue/overlaypanel'
  import Listbox from 'primevue/listbox'
  import InputText from 'primevue/inputtext'
  import Dropdown from 'primevue/dropdown'
  import Menu from 'primevue/menu'

  import DataTable from '@/components/DataTable'
  import { useDataTable } from '@/composables/useDataTable'
  import { VueMonacoEditor as vueMonacoEditor } from '@guolao/vue-monaco-editor'

  defineOptions({ name: 'sql-database-list' })

  const props = defineProps({
    data: { type: Array, required: true },
    columns: { type: Array, required: true },
    addButtonLabel: { type: String, default: '' },
    disabledAddButton: { type: Boolean, default: false },
    title: { type: String, required: true },
    disabledAction: { type: Boolean, default: false },
    monacoTheme: { type: String, default: 'vs-dark' },
    options: {
      type: Array,
      default: () => [
        {
          label: 'Table',
          value: 'table',
          icon: 'pi pi-table'
        },
        {
          label: 'Schema',
          value: 'schema',
          icon: 'ai ai-layers'
        }
      ]
    }
  })

  const dataTypes = [
    'INTEGER',
    'BIGINT',
    'DECIMAL',
    'FLOAT',
    'VARCHAR',
    'TEXT',
    'BOOLEAN',
    'DATE',
    'DATETIME',
    'TIMESTAMP',
    'JSON',
    'UUID'
  ]

  const dataTypeOptions = dataTypes.map((type) => ({ label: type, value: type }))
  const isSchemaView = computed(() => selectedView.value?.value === 'schema')
  const displayDataForView = computed(() =>
    selectedView.value?.value === 'json' ? [] : editableData.value
  )
  const jsonPreview = computed(() => {
    try {
      return JSON.stringify(editableData.value ?? [], null, 2)
    } catch (err) {
      return '[]'
    }
  })
  const monacoOptions = {
    readOnly: true,
    automaticLayout: true,
    wordWrap: 'on',
    minimap: { enabled: false }
  }

  const emit = defineEmits([
    'on-load-data',
    'row-click',
    'sort',
    'page',
    'navigate-other-link',
    'navigate-get-help',
    'other-actions',
    'toggle-filter',
    'row-edit-saved',
    'row-edit-cancel'
  ])

  const tableProps = { ...toRefs(props), loadDisabled: true }
  const editableData = ref([])
  const editingRows = ref([])
  const backups = ref(new Map())
  const rowMenuRef = ref(null)
  const selectedRowData = ref(null)
  const isLoadingEditRow = ref(false)
  watch(
    () => props.data,
    (val) => {
      editableData.value = Array.isArray(val) ? val.map((row) => ({ ...row })) : []
    },
    { immediate: true, deep: true }
  )
  const selectedView = ref({
    label: 'Table',
    value: 'table',
    icon: 'pi pi-table'
  })

  const {
    filters,
    sortFieldValue,
    sortOrderValue,
    isLoading,
    filterBy,
    minimumOfItemsPerPage,
    firstItemIndex,
    changeNumberOfLinesPerPage,
    reload,
    fetchOnSearch,
    handleSearchValue,
    selectedColumns,
    toggleColumnSelector,
    columnSelectorPanel
  } = useDataTable(tableProps, emit)

  const editRow = (row) => {
    const id = row?.id
    if (id == null) return
    backups.value.set(id, { ...row })
    if (!editingRows.value.some((editing) => editing?.id === id)) {
      editingRows.value = [...editingRows.value, row]
    }
  }

  const deleteRow = (row) => {
    const id = row?.id
    if (id == null) return
    editableData.value = editableData.value.filter((item) => item.id !== id)
    backups.value.delete(id)
    editingRows.value = editingRows.value.filter((editing) => editing?.id !== id)
  }

  const onRowEditSave = (event) => {
    const { newData, data } = event || {}
    const id = newData?.id ?? data?.id
    if (id == null) return
    const index = editableData.value.findIndex((item) => item.id === id)
    const oldData = backups.value.get(id)
    if (index !== -1) {
      emit('row-edit-saved', { id, oldData, newData, index })
    }
    backups.value.delete(id)
    editingRows.value = editingRows.value.filter((row) => row?.id !== id)
  }

  const onRowEditCancel = (event) => {
    const { data } = event || {}
    const id = data?.id
    const isNew = data?._isNew === true
    if (isNew) {
      if (id != null) {
        editableData.value = editableData.value.filter((item) => item.id !== id)
        backups.value.delete(id)
        editingRows.value = editingRows.value.filter((row) => row?.id !== id)
      } else if (data?._tempKey) {
        editableData.value = editableData.value.filter((item) => item?._tempKey !== data._tempKey)
        editingRows.value = editingRows.value.filter((row) => row !== data)
      } else {
        editableData.value = editableData.value.filter((item) => item !== data)
        editingRows.value = editingRows.value.filter((row) => row !== data)
      }
      emit('row-edit-cancel', { id, removed: true })
      return
    }
    if (id == null) return
    const original = backups.value.get(id)
    if (original) {
      const index = editableData.value.findIndex((item) => item.id === id)
      if (index !== -1) {
        editableData.value[index] = { ...original }
      }
    }
    backups.value.delete(id)
    editingRows.value = editingRows.value.filter((row) => row?.id !== id)
    emit('row-edit-cancel', { id, original })
  }

  const isRowEditing = (rowIndex) => {
    const row = editableData.value[rowIndex]
    if (!row) return false
    if (row?.id != null) return editingRows.value.some((editing) => editing?.id === row.id)
    return editingRows.value.includes(row)
  }

  const showRowMenu = (event, rowData) => {
    selectedRowData.value = rowData
    if (rowMenuRef.value) {
      rowMenuRef.value.hide()
      rowMenuRef.value.show(event)
    }
  }

  const saveRowEdit = (rowData, rowIndex) => {
    isLoadingEditRow.value = true
    onRowEditSave({ newData: { ...rowData }, data: rowData, index: rowIndex })

    isLoadingEditRow.value = false
  }

  const cancelRowEdit = (rowData, rowIndex) => {
    onRowEditCancel({ data: rowData, index: rowIndex })
  }

  const computedMenuItems = computed(() => {
    const base = []
    base.push({
      label: 'Edit',
      icon: 'pi pi-pencil',
      command: () => {
        if (selectedRowData.value) editRow(selectedRowData.value)
      }
    })
    base.push({
      label: 'Delete',
      icon: 'pi pi-trash',
      command: () => {
        if (selectedRowData.value) deleteRow(selectedRowData.value)
      }
    })
    return base
  })

  const onViewChange = (event) => {
    emit('view-change', event)
  }

  const onPage = (event) => {
    changeNumberOfLinesPerPage(event)
    emit('page', event)
  }

  const toggleFilter = () => emit('toggle-filter')

  const items = [
    {
      icon: 'ai ai-column',
      label: 'Insert Column',
      command: () => {}
    },
    {
      icon: 'pi pi-minus',
      label: 'Insert Row',
      command: () => {}
    }
  ]

  const generateUniqueKey = () => {
    const prefix = 'new-'
    if (typeof crypto !== 'undefined' && crypto?.randomUUID) {
      return `${prefix}${crypto.randomUUID()}`
    }
    return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }

  const generateUniqueId = () => {
    const existingIds = editableData.value
      .map((rowItem) => rowItem?.id)
      .filter((val) => val != null)
    const existingSet = new Set(existingIds)

    const idColumn = (props.columns || []).find((col) => col?.field === 'id')
    const typeLabel = (idColumn?.tagType || '').toString().toLowerCase()
    const isNumericId = [
      'int',
      'integer',
      'bigint',
      'smallint',
      'tinyint',
      'number',
      'numeric'
    ].some((type) => typeLabel.includes(type))

    if (isNumericId) {
      const numericIds = existingIds
        .map((value) => (typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value))
        .filter((num) => Number.isFinite(num))
      const next = (numericIds.length ? Math.max(...numericIds) : 0) + 1
      let candidate = next
      while (existingSet.has(candidate) || existingSet.has(String(candidate))) {
        candidate += 1
      }
      return candidate
    }

    let candidate =
      typeof crypto !== 'undefined' && crypto?.randomUUID
        ? crypto.randomUUID()
        : `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    while (existingSet.has(candidate)) {
      candidate =
        typeof crypto !== 'undefined' && crypto?.randomUUID
          ? crypto.randomUUID()
          : `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    }
    return candidate
  }

  const insertRow = () => {
    const fields = (props.columns || [])
      .filter((col) => col?.field && col.field !== 'actions')
      .map((col) => col.field)
    const hasId = fields.includes('id')
    const base = fields.reduce((acc, key) => {
      acc[key] = ''
      return acc
    }, {})
    base.id = generateUniqueId()
    const newRow = { ...base, _tempKey: generateUniqueKey(), _isNew: true }
    editableData.value = [newRow, ...editableData.value]
    if (hasId) {
      editRow(newRow)
    } else {
      if (!editingRows.value.includes(newRow)) {
        editingRows.value = [...editingRows.value, newRow]
      }
    }
  }
</script>

<style scoped>
  :deep(.p-column-title) {
    display: none !important;
  }
  /* Make the DataTable empty message row and cell fill the body height */

  :deep(.p-datatable-emptymessage > td) {
    height: 600px !important;
    padding: 0 !important;
  }
</style>
