<template>
  <div class="sql-database-list w-full">
    <DataTable
      :data="editableData"
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
      @row-click="(e) => $emit('row-click', e)"
      :first="firstItemIndex"
      :globalFilterFields="filterBy"
      removableSort
      scrollable
      :pt="{
        header: {
          class: 'bg-gray-50 text-gray-900'
        },
        headerContent: {
          class: 'flex items-center gap-2'
        },
        headerText: {
          class: 'text-left'
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
                @click="save"
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
          <span class="flex items-center gap-2 text-color"
            >{{ col.header }}
            <span class="text-color-secondary font-mono">{{ col.tagType }}</span></span
          >
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
          <InputText
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
              outlined
              @click.stop="showRowMenu($event, data)"
              class="w-8 h-8 p-0"
              data-testid="row-actions-menu-button"
            />
          </div>
        </template>
      </DataTable.Column>
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
  import Menu from 'primevue/menu'

  import DataTable from '@/components/DataTable'
  import { useDataTable } from '@/composables/useDataTable'

  defineOptions({ name: 'sql-database-list' })

  const props = defineProps({
    data: { type: Array, required: true },
    columns: { type: Array, required: true },
    addButtonLabel: { type: String, default: '' },
    disabledAddButton: { type: Boolean, default: false },
    title: { type: String, required: true },
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
    return editingRows.value.some((editing) => editing?.id === row.id)
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

  const save = () => {}
</script>

<style scoped>
  :deep(.p-column-title) {
    display: none !important;
  }
</style>
