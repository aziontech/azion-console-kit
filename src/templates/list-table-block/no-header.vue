<template>
  <div data-testid="data-table-container">
    <div
      class="max-w-full cursor-pointer mt-4"
      data-testid="data-table-wrapper"
    >
      <DataTable
        v-if="!isLoading"
        scrollable
        removableSort
        :value="data"
        dataKey="id"
        v-model:filters="filters"
        :paginator="showPagination"
        :rowsPerPageOptions="[10, 20, 50, 100]"
        :rows="MINIMUN_OF_ITEMS_PER_PAGE"
        @row-click="editItemSelected"
        :globalFilterFields="filterBy"
        :loading="isLoading"
        v-model:selection="selectedItems"
        @rowReorder="onRowReorder"
        :pt="pt"
        data-testid="data-table"
      >
        <template #header>
          <slot name="header">
            <div
              class="flex flex-wrap justify-between gap-2 w-full"
              data-testid="data-table-header"
            >
              <span
                class="flex flex-row p-input-icon-left max-sm:w-full"
                data-testid="data-table-search-container"
              >
                <i class="pi pi-search" />
                <InputText
                  class="w-full md:min-w-[320px]"
                  v-model.trim="filters.global.value"
                  placeholder="Search"
                  data-testid="data-table-search-input"
                />
              </span>
              <slot name="addButton">
                <PrimeButton
                  class="max-sm:w-full"
                  @click="navigateToAddPage"
                  icon="pi pi-plus"
                  :label="addButtonLabel"
                  v-if="addButtonLabel"
                  :data-testid="`create_${addButtonLabel}_button`"
                />
              </slot>
            </div>
          </slot>
        </template>

        <Column
          v-if="reorderableRows"
          rowReorder
          headerStyle="width: 3rem"
          data-testid="data-table-reorder-column"
        >
          <template #body="slotProps">
            <i
              v-if="isReorderAllEnabled || slotProps.index"
              class="pi pi-bars cursor-move"
              data-pc-section="rowreordericon"
              data-testid="data-table-reorder-icon"
            ></i>
          </template>
        </Column>

        <Column
          v-if="showselectionMode"
          selectionMode="multiple"
          headerStyle="width: 3rem"
          data-testid="data-table-selection-column"
        ></Column>

        <Column
          sortable
          v-for="col of selectedColumns"
          :key="col.field"
          :field="col.field"
          :header="col.header"
          data-testid="data-table-column"
        >
          <template #body="{ data: rowData }">
            <template v-if="col.type !== 'component'">
              <div
                v-html="rowData[col.field]"
                data-testid="data-table-column-cell"
              />
            </template>
            <template v-else>
              <component :is="col.component(rowData[col.field])" />
            </template>
          </template>
        </Column>
        <Column
          :frozen="showActions"
          alignFrozen="right"
          data-testid="data-table-actions-column"
        >
          <template #header>
            <div
              class="flex justify-end w-full"
              data-testid="data-table-actions-column-header"
            >
              <PrimeButton
                outlined
                icon="ai ai-column"
                class="table-button"
                @click="toggleColumnSelector"
                v-tooltip.top="{ value: 'Hidden Columns', showDelay: 200 }"
                data-testid="data-table-actions-column-hidden-columns-button"
              >
              </PrimeButton>
              <OverlayPanel
                ref="columnSelectorPanel"
                :pt="{
                  content: { class: 'p-0' }
                }"
                data-testid="data-table-actions-column-hidden-columns-overlay"
              >
                <Listbox
                  v-model="selectedColumns"
                  multiple
                  :options="[{ label: 'Hidden Columns', items: columns }]"
                  class="hidden-columns-panel"
                  optionLabel="header"
                  optionGroupLabel="label"
                  optionGroupChildren="items"
                  data-testid="data-table-actions-column-hidden-columns-listbox"
                >
                  <template #optiongroup="slotProps">
                    <p class="p-0 text-sm font-medium">{{ slotProps.option.label }}</p>
                  </template>
                </Listbox>
              </OverlayPanel>
            </div>
          </template>
          <template #body="{ data: rowData }">
            <div
              class="flex justify-end"
              v-if="showActions"
              data-testid="data-table-actions-column-body"
            >
              <PrimeMenu
                :ref="assignMenuRef(rowData.id)"
                id="overlay_menu"
                v-bind:model="actionOptions(rowData)"
                :popup="true"
                data-testid="data-table-actions-column-menu"
              />
              <PrimeButton
                v-tooltip.top="{ value: 'Actions', showDelay: 200 }"
                size="small"
                icon="pi pi-ellipsis-h"
                outlined
                @click="(event) => toggleActionsMenu(event, rowData)"
                class="cursor-pointer table-button"
                data-testid="data-table-actions-column-actions-button"
              />
            </div>
          </template>
        </Column>
        <template #empty>
          <slot name="noRecordsFound">
            <div
              class="my-4 flex flex-col gap-3 justify-center items-start"
              data-testid="data-table-empty-message-container"
            >
              <p
                class="text-md font-normal text-secondary"
                data-testid="table-block-no-header__empty-message"
              >
                {{ emptyListMessage }}
              </p>
            </div>
          </slot>
        </template>
      </DataTable>

      <DataTable
        v-else
        :value="Array(5)"
        :pt="{
          header: { class: '!border-t-0' }
        }"
        data-testid="data-table-loading-skeleton"
      >
        <template #header>
          <div
            class="flex self-start"
            data-testid="data-table-loading-skeleton-header"
          >
            <span class="flex flex-row p-input-icon-left">
              <i class="pi pi-search" />
              <InputText
                class="h-8 w-full md:min-w-[320px]"
                v-model="filters.global.value"
                placeholder="Search"
                data-testid="data-table-loading-skeleton-search-input"
              />
            </span>
          </div>
        </template>
        <Column
          sortable
          v-for="col of columns"
          :key="col.field"
          :field="col.field"
          :header="col.header"
          data-testid="data-table-loading-skeleton-column"
        >
          <template #body>
            <Skeleton />
          </template>
        </Column>
      </DataTable>
    </div>
    <DeleteDialog
      :informationForDeletion="informationForDeletion"
      @successfullyDeleted="updatedTable()"
      data-testid="delete-dialog"
    />
  </div>
</template>

<script setup>
  import { getArrayChangedIndexes } from '@/helpers/get-array-changed-indexes'
  import { FilterMatchMode } from 'primevue/api'
  import PrimeButton from 'primevue/button'
  import Column from 'primevue/column'
  import DataTable from 'primevue/datatable'
  import InputText from 'primevue/inputtext'
  import Listbox from 'primevue/listbox'
  import PrimeMenu from 'primevue/menu'
  import OverlayPanel from 'primevue/overlaypanel'
  import Skeleton from 'primevue/skeleton'
  import { useToast } from 'primevue/usetoast'
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import DeleteDialog from './dialog/delete-dialog'

  defineOptions({ name: 'list-table-block' })

  const emit = defineEmits(['on-load-data', 'authorize', 'on-select-data'])
  const props = defineProps({
    columns: {
      type: Array,
      default: () => [{ field: 'name', header: 'Name' }]
    },
    pageTitleDelete: {
      type: String
    },
    createPagePath: {
      type: String,
      default: () => '/'
    },
    editInDrawer: {
      type: Function
    },
    editPagePath: {
      type: String,
      default: () => '/'
    },
    addButtonLabel: {
      type: String,
      default: () => ''
    },
    authorizeNode: {
      type: Boolean
    },
    listService: {
      type: Function
    },
    deleteService: {
      type: Function
    },
    onReorderService: {
      type: Function
    },
    reorderableRows: {
      type: Boolean
    },
    pt: {
      type: Object,
      required: false
    },
    emptyListMessage: {
      type: String,
      default: () => 'No registers found.'
    },
    dataFilted: {
      type: Array,
      default: () => []
    },
    hasListService: {
      type: Boolean,
      default: false
    },
    showselectionMode: {
      type: Boolean,
      default: false
    },
    cleanSelectData: {
      type: Boolean,
      default: false
    },
    isReorderAllEnabled: {
      type: Boolean,
      default: false
    },
    rowActions: {
      type: Array,
      default: () => []
    }
  })

  const MINIMUN_OF_ITEMS_PER_PAGE = 10

  const showActions = ref(true)
  const selectedId = ref(null)
  const filters = ref({ global: { value: '', matchMode: FilterMatchMode.CONTAINS } })
  const isLoading = ref(false)
  const data = ref([])
  const informationForDeletion = ref({})
  const selectedItemData = ref(null)
  const selectedColumns = ref([])
  const selectedItems = ref()

  onMounted(() => {
    loadData({ page: 1 })
    selectedColumns.value = props.columns
  })

  const filterBy = computed(() => {
    const filtersPath = props.columns.filter((el) => el.filterPath).map((el) => el.filterPath)
    const filters = props.columns.map((item) => item.field)

    return [...filters, ...filtersPath]
  })

  const showPagination = computed(() => {
    return data.value.length > MINIMUN_OF_ITEMS_PER_PAGE
  })

  const actionOptions = (rowData) => {
    const actionOptions = []

    if (props.rowActions?.length) {
      props.rowActions.forEach((action) => {
        if (action.visibleAction?.(rowData)) return

        actionOptions.push({
          ...action,
          disabled: rowData?.isDefault ? rowData?.isDefault : false,
          command: () => action.command(rowData)
        })
      })
    }

    if (props.deleteService) {
      actionOptions.push({
        label: 'Delete',
        icon: 'pi pi-fw pi-trash',
        severity: 'error',
        command: () => openDeleteDialog()
      })
    }

    showActions.value = actionOptions.length > 0

    return actionOptions
  }

  const toast = useToast()

  const loadData = async ({ page }) => {
    try {
      if (props.hasListService) return
      isLoading.value = true
      const response = await props.listService({ page })
      data.value = response
    } catch (error) {
      data.value = []
      showToast('error', error)
    } finally {
      isLoading.value = false
    }
  }

  const reload = async () => {
    await loadData({ page: 1 })
  }
  defineExpose({ reload })

  const router = useRouter()

  const navigateToAddPage = () => {
    router.push(props.createPagePath)
  }

  const menuRef = ref({})
  const toggleActionsMenu = (event, selectedItem) => {
    selectedItemData.value = selectedItem
    selectedId.value = selectedItem.id
    menuRef.value[selectedItem.id].toggle(event)
  }

  const editItemSelected = ({ data: item, originalEvent }) => {
    const clickIsCheckbox = originalEvent.srcElement.className?.animVal?.includes('p-checkbox-icon')
    if (props.editInDrawer) {
      if (clickIsCheckbox) {
        return
      }
      props.editInDrawer(item)
      return
    }
    router.push({ path: `${props.editPagePath}/${item.id}` })
  }

  const openDeleteDialog = () => {
    informationForDeletion.value = {
      title: props.pageTitleDelete,
      selectedID: selectedId.value,
      selectedItemData: selectedItemData.value,
      deleteService: props.deleteService,
      deleteDialogVisible: true,
      rerender: Math.random()
    }
  }

  const showToast = (severity, detail) => {
    if (!detail) return
    const options = {
      closable: true,
      severity,
      summary: severity,
      detail
    }

    toast.add(options)
  }

  const updatedTable = () => {
    loadData({ page: 1 })
  }

  const onRowReorder = async (event) => {
    try {
      isLoading.value = true
      const tableData = getArrayChangedIndexes(data.value, event.value, props.isReorderAllEnabled)
      await props.onReorderService(tableData)
      data.value = event.value

      showToast('success', 'Reorder saved')
    } catch (error) {
      showToast('error', error)
    } finally {
      isLoading.value = false
    }
  }

  const columnSelectorPanel = ref(null)
  const toggleColumnSelector = (event) => {
    columnSelectorPanel.value.toggle(event)
  }

  watch(data, (currentState) => {
    const hasData = currentState.length > 0
    emit('on-load-data', hasData)
  })

  const assignMenuRef = (id) => {
    return (document) => {
      if (document !== null) {
        menuRef.value[id] = document
      }
    }
  }

  watch(selectedItems, (selectedData) => {
    emit('on-select-data', selectedData)
  })

  watch(
    () => props.dataFilted,
    (newValue) => (data.value = newValue)
  )

  watch(
    () => props.cleanSelectData,
    (value) => {
      if (value) {
        selectedItems.value = []
      }
    }
  )
</script>
