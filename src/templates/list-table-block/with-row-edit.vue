<template>
  <div class="max-w-full">
    <DataTable
      v-model:editingRows="editingRowsItens"
      :value="props.data"
      editMode="row"
      dataKey="id"
      scrollable
      @row-edit-save="onRowEditSave"
      v-model:filters="filters"
      :globalFilterFields="filterBy"
      removableSort
      :paginator="true"
      :rowsPerPageOptions="[10, 20, 50, 100]"
      :rows="minimumOfItemsPerPage"
      @page="changeNumberOfLinesPerPage"
      :first="firstItemIndex"
      :pt="{
        table: { style: 'min-width: 50rem' },
        column: {
          bodycell: ({ state }) => ({
            style: state['d_editing'] && 'padding-top: 0.6rem; padding-bottom: 0.6rem'
          })
        }
      }"
    >
      <template #header>
        <slot name="header">
          <div class="flex flex-wrap justify-between gap-2 w-full">
            <span class="flex flex-row p-input-icon-left items-center max-sm:w-full">
              <i class="pi pi-search" />
              <InputText
                class="h-8 w-full md:min-w-[20rem]"
                v-model.trim="filters.global.value"
                placeholder="Search"
              />
            </span>

            <slot name="addButton">
              <PrimeButton
                class="max-sm:w-full"
                :disabled="disabledAddButton"
                @click="$emit('add-button-click')"
                icon="pi pi-plus"
                :label="addButtonLabel"
                v-if="addButtonLabel"
              />
            </slot>
          </div>
        </slot>
      </template>
      <Column
        v-for="col in selectedColumns"
        :key="col.field"
        :field="col.field"
        :header="col.header"
        :style="col.style || 'width: 20%'"
        :sortable="col.sortable !== false"
        :sortField="col.sortField"
      >
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
          <slot
            :name="`editor-${col.field}`"
            :data="data"
            :field="field"
            :value="data[field]"
            :updateValue="
              (value) => {
                data[field] = value
              }
            "
          >
            <InputText
              v-model="data[field]"
              class="w-full"
            />
          </slot>
        </template>
      </Column>
      <Column
        :rowEditor="true"
        :frozen="true"
        :alignFrozen="'right'"
        style="width: 1%; min-width: 1rem"
        bodyStyle="text-align:center"
      >
        <template #header>
          <div
            class="flex justify-end w-full"
            data-testid="data-table-actions-column-header"
          >
            <PrimeButton
              v-if="hasExportToCsv"
              @click="handleExportTableDataToCSV"
              outlined
              class="max-sm:w-full ml-auto mr-2"
              icon="pi pi-download"
              v-tooltip.bottom="{ value: 'Export to CSV', showDelay: 200 }"
            />
            <PrimeButton
              outlined
              icon="ai ai-column"
              class="table-button"
              @click="toggleColumnSelector"
              v-tooltip.top="{ value: 'Available Columns', showDelay: 200 }"
              data-testid="data-table-actions-column-header-toggle-columns"
            >
            </PrimeButton>
            <OverlayPanel
              ref="columnSelectorPanel"
              :pt="{
                content: { class: 'p-0' }
              }"
              data-testid="data-table-actions-column-header-toggle-columns-panel"
            >
              <Listbox
                v-model="selectedColumns"
                multiple
                :options="[{ label: 'Available Columns', items: props.columns }]"
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
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, watch } from 'vue'
  import { FilterMatchMode } from 'primevue/api'
  import InputText from 'primevue/inputtext'
  import DataTable from 'primevue/datatable'
  import Column from 'primevue/column'
  import PrimeButton from 'primevue/button'
  import OverlayPanel from 'primevue/overlaypanel'
  import Listbox from 'primevue/listbox'

  defineOptions({ name: 'list-table-block-with-row-edit' })

  const props = defineProps({
    columns: {
      type: Array,
      required: true
    },
    data: {
      type: Array,
      required: true
    },
    addButtonLabel: {
      type: String,
      default: 'Add'
    },
    disabledAddButton: {
      type: Boolean,
      default: false
    },
    hasExportToCsv: {
      type: Boolean,
      default: false
    },
    frozenSize: {
      type: String,
      default: '13rem'
    },
    editingRows: {
      type: Array,
      default: () => []
    }
  })

  const editingRowsItens = ref([])
  const firstItemIndex = ref(0)
  const minimumOfItemsPerPage = ref(10)
  const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  })
  const selectedColumns = ref([])
  const columnSelectorPanel = ref(null)

  const emit = defineEmits(['row-edit-save', 'row-edit-cancel', 'add-button-click'])

  const filterBy = computed(() => {
    return props.columns.map((item) => item.field)
  })

  const changeNumberOfLinesPerPage = (event) => {
    minimumOfItemsPerPage.value = event.rows
    firstItemIndex.value = event.first
  }

  const toggleColumnSelector = (event) => {
    columnSelectorPanel.value.toggle(event)
  }

  onMounted(() => {
    selectedColumns.value = props.columns
  })

  const handleExportTableDataToCSV = () => {
    // TODO: Implementar funcionalidade de export CSV
    // eslint-disable-next-line no-console
    console.log('Export CSV functionality to be implemented')
  }

  const onRowEditSave = (event) => {
    const { newData, index, data } = event
    emit('row-edit-save', { newData, data, index })
  }

  watch(
    () => props.editingRows,
    (newEditingRows) => {
      editingRowsItens.value = [...newEditingRows, ...editingRowsItens.value]
    }
  )
</script>
