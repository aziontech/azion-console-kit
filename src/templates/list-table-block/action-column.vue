<template>
  <div class="max-w-full">
    <DataTable
      class="overflow-clip rounded-md"
      v-if="!isLoading"
      @rowReorder="onRowReorder"
      scrollable
      removableSort
      :value="data"
      dataKey="id"
      selectionMode="single"
      @row-click="editItemSelected"
      v-model:filters="filters"
      :paginator="showPagination"
      :rowsPerPageOptions="[10, 20, 50, 100]"
      :rows="MINIMUM_OF_ITEMS_PER_PAGE"
      :globalFilterFields="filterBy"
      :loading="isLoading"
    >
      <template #header>
        <div class="flex flex-wrap justify-between gap-2 w-full">
          <span class="flex flex-row p-input-icon-left items-center max-sm:w-full">
            <i class="pi pi-search" />
            <InputText
              class="h-8 w-full md:min-w-[320px]"
              v-model.trim="filters.global.value"
              :data-testid="`search_input`"
              placeholder="Search"
            />
          </span>
          <slot name="addButton">
            <PrimeButton
              class="max-sm:w-full"
              @click="navigateToAddPage"
              icon="pi pi-plus"
              :data-testid="`create_${addButtonLabel}_button`"
              :label="addButtonLabel"
              v-if="addButtonLabel"
            />
          </slot>
        </div>
      </template>

      <Column
        v-if="reorderableRows"
        rowReorder
        headerStyle="width: 3rem"
      />

      <Column
        sortable
        v-for="col of selectedColumns"
        :key="col.field"
        :field="col.field"
        :header="col.header"
        :sortField="col?.sortField"
      >
        <template #body="{ data: rowData }">
          <template v-if="col.type !== 'component'">
            <div
              v-html="rowData[col.field]"
              :data-testid="`list-table-block__column__${col.field}__row`"
            ></div>
          </template>
          <template v-else>
            <component
              :is="col.component(extractFieldValue(rowData, col.field))"
              :data-testid="`list-table-block__column__${col.field}__row`"
            ></component>
          </template>
        </template>
      </Column>

      <Column
        :frozen="true"
        :alignFrozen="'right'"
        headerStyle="width: 13rem"
      >
        <template #header>
          <div class="flex justify-end w-full">
            <PrimeButton
              outlined
              icon="ai ai-column"
              class="table-button"
              @click="toggleColumnSelector"
              v-tooltip.top="{ value: 'Hidden Columns', showDelay: 200 }"
            >
            </PrimeButton>
            <OverlayPanel
              ref="columnSelectorPanel"
              :pt="{
                content: { class: 'p-0' }
              }"
            >
              <Listbox
                v-model="selectedColumns"
                multiple
                :options="[{ label: 'Hidden Columns', items: columns }]"
                class="hidden-columns-panel"
                optionLabel="header"
                optionGroupLabel="label"
                optionGroupChildren="items"
              >
                <template #optiongroup="slotProps">
                  <p class="text-sm font-medium">{{ slotProps.option.label }}</p>
                </template>
              </Listbox>
            </OverlayPanel>
          </div>
        </template>
        <template #body="{ data: rowData }">
          <div
            class="flex justify-end"
            v-if="!isRenderActions"
          >
            <PrimeButton
              size="small"
              :icon="getActionIcon"
              outlined
              @click="executeCommand(rowData.id)"
              class="cursor-pointer table-button"
            />
          </div>
          <div
            class="flex justify-end"
            v-if="isRenderActions"
          >
            <PrimeMenu
              :ref="(document) => setMenuRefForRow(rowData.id, document)"
              id="overlay_menu"
              v-bind:model="actionOptions(rowData)"
              :popup="true"
            />
            <PrimeButton
              v-tooltip.top="{ value: 'Actions', showDelay: 200 }"
              size="small"
              icon="pi pi-ellipsis-h"
              outlined
              @click="(event) => toggleActionsMenu(event, rowData.id)"
              class="cursor-pointer table-button"
            />
          </div>
        </template>
      </Column>
      <template #empty>
        <slot name="noRecordsFound">
          <div class="my-4 flex flex-col gap-3 justify-center items-start">
            <p class="text-md font-normal text-secondary">{{ emptyListMessage }}</p>
          </div>
        </slot>
      </template>
    </DataTable>

    <DataTable
      v-else
      :value="Array(10)"
      :pt="{
        header: { class: '!border-t-0' }
      }"
    >
      <template #header>
        <div class="flex flex-wrap justify-between gap-2 w-full">
          <span class="flex flex-row h-8 p-input-icon-left max-sm:w-full">
            <i class="pi pi-search" />
            <InputText
              class="w-full h-8 md:min-w-[320px]"
              v-model="filters.global.value"
              placeholder="Search"
            />
          </span>
          <PrimeButton
            class="max-sm:w-full"
            @click="navigateToAddPage"
            icon="pi pi-plus"
            :label="addButtonLabel"
            v-if="addButtonLabel"
          />
        </div>
      </template>
      <Column
        sortable
        v-for="col of columns"
        :key="col.field"
        :field="col.field"
        :header="col.header"
      >
        <template #body>
          <Skeleton />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
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
  import DeleteDialog from './dialog/delete-dialog-new.vue'
  import { useDialog } from 'primevue/usedialog'

  defineOptions({ name: 'list-table-block-new' })

  const emit = defineEmits(['on-load-data', 'on-before-go-to-add-page', 'on-before-go-to-edit'])

  const props = defineProps({
    columns: {
      type: Array,
      default: () => [{ field: 'name', header: 'Name' }]
    },
    isGraphql: {
      type: Boolean
    },
    createPagePath: {
      type: String,
      default: () => '/'
    },
    editPagePath: {
      type: String,
      default: () => '/'
    },
    editInDrawer: {
      type: Function
    },
    addButtonLabel: {
      type: String,
      default: () => ''
    },
    listService: {
      required: true,
      type: Function
    },
    enableEditClick: {
      type: Boolean,
      default: true
    },
    reorderableRows: {
      type: Boolean
    },
    emptyListMessage: {
      type: String,
      default: () => 'No registers found.'
    },
    actions: {
      type: Array,
      default: () => []
    }
  })

  const MINIMUM_OF_ITEMS_PER_PAGE = 10

  const selectedId = ref(null)
  const filters = ref({
    global: { value: '', matchMode: FilterMatchMode.CONTAINS }
  })
  const isLoading = ref(false)
  const data = ref([])
  const selectedColumns = ref([])
  const columnSelectorPanel = ref(null)
  const menuRef = ref({})

  const dialog = useDialog()
  const toast = useToast()
  const router = useRouter()

  onMounted(() => {
    loadData({ page: 1 })
    selectedColumns.value = props.columns
  })

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

  const toggleColumnSelector = (event) => {
    columnSelectorPanel.value.toggle(event)
  }

  const onRowReorder = (event) => {
    data.value = event.value
  }

  const openDialog = (dialogComponent, body) => {
    dialog.open(dialogComponent, body)
  }

  const actionOptions = (rowData) => {
    const createActionOption = (action) => {
      return {
        ...action,
        command: () => {
          switch (action.type) {
            case 'dialog':
              openDialog(action.dialog.component, action.dialog.body(rowData))
              break
            case 'delete':
              const bodyDelete = {
                data: {
                  title: action.title,
                  selectedID: selectedId.value,
                  deleteDialogVisible: true,
                  deleteService: action.service,
                  rerender: Math.random()
                },
                onClose: () => updatedTable()
              }
              openDialog(DeleteDialog, bodyDelete)
              break
            case 'action':
              action.commandAction(rowData)
              break
          }
        }
      }
    }

    const actions = props.actions
      .filter((action) => !action.visibleAction || action.visibleAction(rowData))
      .map(createActionOption)

    return actions
  }

  const loadData = async ({ page }) => {
    try {
      isLoading.value = true

      const response = props.isGraphql
        ? await props.listService()
        : await props.listService({ page })
      data.value = response
    } catch (error) {
      data.value = []
      showToast('error', error)
    } finally {
      isLoading.value = false
    }
  }

  const navigateToAddPage = () => {
    emit('on-before-go-to-add-page')
    router.push(props.createPagePath)
  }

  const toggleActionsMenu = (event, selectedID) => {
    if (!selectedID) {
      throw new Error('Please provide an id for each data item through the service adapter')
    }
    selectedId.value = selectedID
    menuRef.value[selectedID].toggle(event)
  }

  const editItemSelected = ({ data: item }) => {
    emit('on-before-go-to-edit')
    if (props.editInDrawer) {
      props.editInDrawer(item)
    } else if (props.enableEditClick) {
      router.push({ path: `${props.editPagePath}/${item.id}` })
    }
  }

  const executeCommand = (rowData) => {
    const { command } = actionOptions(rowData)[0]
    command()
  }

  const updatedTable = () => {
    loadData({ page: 1 })
  }

  const extractFieldValue = (rowData, field) => {
    return rowData[field]
  }

  const setMenuRefForRow = (rowDataID, document) => {
    const tableRef = (menuRef.value[rowDataID] = document)
    return tableRef
  }

  const filterBy = computed(() => {
    const filtersPath = props.columns.filter((el) => el.filterPath).map((el) => el.filterPath)
    const filters = props.columns.map((item) => item.field)

    return [...filters, ...filtersPath]
  })

  const showPagination = computed(() => {
    return data.value.length > MINIMUM_OF_ITEMS_PER_PAGE
  })

  const isRenderActions = computed(() => {
    return props.actions && props.actions.length > 1
  })

  const getActionIcon = computed(() => {
    return props.actions[0].icon
  })

  watch(data, (currentState) => {
    const hasData = currentState?.length > 0
    emit('on-load-data', !!hasData)
  })
</script>
