<template>
  <div
    class="max-w-full"
    :class="{ 'mt-4': isTabs }"
    data-testid="data-table-container"
  >  
    <DataTable    
      ref="dataTableRef"
      class="overflow-clip rounded-md"      
      v-model:expandedRowGroups="expandedRowGroups"
      @rowReorder="onRowReorder"
      scrollable      
      removableSort
      :value="data"
      dataKey="id"
      @row-click="editItemSelected"
      rowHover
      v-model:filters="filters"
      :globalFilterFields="filterBy"
      v-model:selection="selectedItems"
      :loading="isLoading"
      data-testid="data-table"
      expandableRowGroups
      rowGroupMode="subheader"
      groupRowsBy="phase.content"
      sortField="phase.content"
      sortMode="single"
    >
      <template
        #header
        v-if="!props.hiddenHeader"
      >
        <slot
          name="header"
        >
          <div
            class="flex flex-wrap justify-between gap-2 w-full"
            data-testid="data-table-header"
          >
            <span
              class="flex flex-row p-input-icon-left items-center max-sm:w-full"
              data-testid="data-table-search"
            >
              <i class="pi pi-search" />
              <InputText
                class="h-8 w-full md:min-w-[20rem]"
                v-model.trim="filters.global.value"
                data-testid="data-table-search-input"
                placeholder="Search"
              />
            </span>

            <slot
              name="addButton"
              data-testid="data-table-add-button"
              :reload="reload"
              :data="data"
            >
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
        </slot>
      </template>

      <Column
        v-if="orderableRows"
        rowReorder
        headerStyle="width: 3rem"
        data-testid="data-table-reorder-column"
      />

      <template #groupheader="slotProps">
        <span class="vertical-align-middle ml-2 font-bold line-height-3">
          {{ slotProps.data.phase.content }}
        </span>
      </template>

      <Column
        v-if="showSelectionMode"
        selectionMode="multiple"
        headerStyle="width: 3rem"
      />

      <Column
        :sortable="!col.disableSort"
        v-for="col of selectedColumns"
        :key="col.field"
        :field="col.field"
        :header="col.header"
        :sortField="col?.sortField"
        :class="col.disableSort ? '' : 'hover:cursor-pointer'"
        data-testid="data-table-column"
      >
        <template #body="{ data: rowData }">
          <template v-if="col.type !== 'component'">
            <div
              v-html="rowData[col.field]"
              :data-testid="`list-table-block__column__${col.field}__row`"
            />
          </template>
          <template v-else>
            <component
              :is="col.component(extractFieldValue(rowData, col.field))"
              :data-testid="`list-table-block__column__${col.field}__row`"
            />
          </template>
        </template>
      </Column>

      <Column
        :frozen="true"
        :alignFrozen="'right'"
        headerStyle="width: 13rem"
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
                :options="[{ label: 'Hidden Columns', items: columns }]"
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
        <template
          #body="{ data: rowData }"
          v-if="isRenderActions"
        >
          <div
            class="flex justify-end"
            v-if="isRenderOneOption"
            data-testid="data-table-actions-column-body-action"
          >
            <PrimeButton
              size="small"
              outlined
              v-bind="optionsOneAction(rowData)"
              @click="executeCommand(rowData)"
              class="cursor-pointer table-button"
              data-testid="data-table-actions-column-body-action-button"
            />
          </div>
          <div
            class="flex justify-end"
            v-else
            data-testid="data-table-actions-column-body-actions"
          >
            <PrimeMenu
              :ref="setMenuRefForRow(rowData.id)"
              id="overlay_menu"
              v-bind:model="actionOptions(rowData)"
              :popup="true"
              data-testid="data-table-actions-column-body-actions-menu"
              :pt="{
                menuitem: ({ context }) => ({
                  'data-testid': `data-table__actions-menu-item__${context.item?.label}-button`
                })
              }"
            />
            <PrimeButton
              v-tooltip.top="{ value: 'Actions', showDelay: 200 }"
              size="small"
              icon="pi pi-ellipsis-h"
              outlined
              @click="(event) => toggleActionsMenu(event, rowData.id)"
              class="cursor-pointer table-button"
              data-testid="data-table-actions-column-body-actions-menu-button"
            />
          </div>
        </template>
      </Column>

      <template #empty>
        <slot
          name="noRecordsFound"
          data-testid="data-table-empty-content"
        >
          <div class="my-4 flex flex-col gap-3 justify-center items-start">
            <p
              class="text-md font-normal text-secondary"
              data-testid="list-table-block__empty-message__text"
            >
              {{ emptyListMessage }}
            </p>
          </div>
        </slot>
      </template>
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
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import DeleteDialog from '../dialog/delete-dialog.vue'
  import { useDialog } from 'primevue/usedialog'
  import { useToast } from 'primevue/usetoast'

  defineOptions({ name: 'list-table-block-new' })

  const emit = defineEmits([
    'on-load-data',
    'on-reorder',
    'on-before-go-to-add-page',
    'on-before-go-to-edit',
    'update:selectedItensData'
  ])


  const props = defineProps({
    hiddenHeader: {
      type: Boolean
    },
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
    orderableRows: {
      type: Boolean
    },
    emptyListMessage: {
      type: String,
      default: () => 'No registers found.'
    },
    actions: {
      type: Array,
      default: () => []
    },
    isTabs: {
      type: Boolean,
      default: false
    },
    showSelectionMode: {
      type: Boolean
    },
    selectedItensData: {
      type: Array,
      default: () => []
    },
    exportFileName: {
      type: String
    },
    pt: {
      type: Object,
      default: () => ({})
    },
    apiFields: {
      type: Array,
      default: () => []
    },
    defaultOrderingFieldName: {
      type: String,
      default: () => ''
    }
  })


  const isRenderActions = !!props.actions?.length
  const isRenderOneOption = props.actions?.length === 1
  const selectedId = ref(null)
  const expandedRowGroups = ref(['Request', 'Response'])
  const dataTableRef = ref(null)

  const filters = ref({
    global: { value: '', matchMode: FilterMatchMode.CONTAINS }
  })
  
  const isLoading = ref(false)
  const data = ref([])
  const selectedColumns = ref([])
  const columnSelectorPanel = ref(null)
  const menuRef = ref({})

  const dialog = useDialog()
  const router = useRouter()
  const toast = useToast()

  const totalRecords = ref()
  const savedSearch = ref('')

  const firstLoadData = ref(true)

  const selectedItems = computed({
    get: () => {
      return props.selectedItensData
    },
    set: (value) => {
      emit('update:selectedItensData', value)
    }
  })

  const toggleColumnSelector = (event) => {
    columnSelectorPanel.value.toggle(event)
  }

  const moveItem = (originalData, referenceArray, fromIndex, toIndex) => {
    const originalArray = [...originalData]
    const oldItemMove = toIndex + Math.sign(fromIndex - toIndex)
    const itemToMoveId = referenceArray[toIndex]
    const targetItemId = referenceArray[oldItemMove]

    const originalItemIndex = originalArray.findIndex((item) => item.id === itemToMoveId.id)
    const targetItemIndex = originalArray.findIndex((item) => item.id === targetItemId.id)

    const [itemToMove] = originalArray.splice(originalItemIndex, 1)
    originalArray.splice(targetItemIndex, 0, itemToMove)

    return originalArray
  }

  const onRowReorder = async (event) => {
    
  }

  const openDialog = (dialogComponent, body) => {
    dialog.open(dialogComponent, body)
  }

  const actionOptions = (rowData) => {
    const createActionOption = (action) => {
      return {
        ...action,
        disabled: action.disabled && action.disabled(rowData),
        command: () => {
          switch (action.type) {
            case 'dialog':
              openDialog(action.dialog.component, action.dialog.body(rowData, reload))
              break
            case 'delete':
              {
                const bodyDelete = {
                  data: {
                    title: action.title,
                    selectedID: rowData.id,
                    selectedItemData: rowData,
                    deleteDialogVisible: true,
                    deleteService: action.service,
                    rerender: Math.random()
                  },
                  onClose: (opt) => opt.data.updated && reload()
                }
                openDialog(DeleteDialog, bodyDelete)
              }
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

  const loadData = async ({ page, ...query }) => {
    if (props.listService) {
      try {
        isLoading.value = true
        const { count = 0, body = [] } = props.isGraphql
          ? await props.listService()
          : await props.listService({ page, ...query })
        data.value = body
        totalRecords.value = count
      } catch (error) {
        const errorMessage = error.message || error
        toast.add({
          closable: true,
          severity: 'error',
          summary: 'error',
          detail: errorMessage
        })
      } finally {
        isLoading.value = false
        if (firstLoadData.value) {
          const hasData = data.value?.length > 0
          emit('on-load-data', !!hasData)
        }
        firstLoadData.value = false
      }
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
    emit('on-before-go-to-edit', item)
    if (props.editInDrawer) {
      props.editInDrawer(item)
    } else if (props.enableEditClick) {
      router.push({ path: `${props.editPagePath}/${item.id}` })
    }
  }

  const executeCommand = (rowData) => {
    const [firstAction] = actionOptions(rowData)
    firstAction?.command()
  }

  const optionsOneAction = (rowData) => {
    const [firstAction] = actionOptions(rowData)
    return {
      icon: firstAction?.icon,
      disabled: firstAction?.disabled
    }
  }

  const reload = async (query = {}) => {
    const commonParams = {
      fields: props.apiFields,
      ...query
    }

    if (props.lazy) {
      commonParams.search = savedSearch.value
    }

    loadData(commonParams)
  }

  const extractFieldValue = (rowData, field) => {
    return rowData[field]
  }

  const setMenuRefForRow = (rowDataID) => {
    return (document) => {
      if (document !== null) {
        menuRef.value[rowDataID] = document
      }
    }
  }

  const filterBy = computed(() => {
    const filtersPath = props.columns.filter((el) => el.filterPath).map((el) => el.filterPath)
    const filters = props.columns.map((item) => item.field)

    return [...filters, ...filtersPath]
  })

  onMounted(() => {
    loadData({
      fields: props.apiFields,
      ordering: props.defaultOrderingFieldName
    })
    selectedColumns.value = props.columns
  })

  defineExpose({ reload })
</script>
