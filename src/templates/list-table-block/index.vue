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
      :rows="MINIMUN_OF_ITEMS_PER_PAGE"
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
              placeholder="Search"
            />
          </span>
          <slot name="addButton">
            <PrimeButton
              class="max-sm:w-full"
              @click="navigateToAddPage"
              icon="pi pi-plus"
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
            <div v-html="rowData[col.field]"></div>
          </template>
          <template v-else>
            <component :is="col.component(rowData[col.field])"></component>
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
            v-if="showActions"
          >
            <PrimeMenu
              :ref="(doc) => (menuRef[rowData.id] = doc)"
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
  <DeleteDialog
    :informationForDeletion="informationForDeletion"
    @successfullyDeleted="updatedTable()"
  />
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
  import DeleteDialog from './dialog/delete-dialog'

  defineOptions({ name: 'list-table-block' })
  const emit = defineEmits(['on-load-data', 'on-before-go-to-add-page', 'on-before-go-to-edit'])

  const props = defineProps({
    columns: {
      type: Array,
      default: () => [{ field: 'name', header: 'Name' }]
    },
    isGraphql: {
      type: Boolean
    },
    pageTitleDelete: {
      type: String,
      required: true
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
    deleteService: {
      type: Function
    },
    enableEditClick: {
      type: Boolean,
      default: true
    },
    reorderableRows: {
      type: Boolean
    },
    rowActions: {
      type: Array,
      default: () => []
    },
    emptyListMessage: {
      type: String,
      default: () => 'No registers found.'
    }
  })

  const MINIMUN_OF_ITEMS_PER_PAGE = 10

  const selectedId = ref(null)
  const filters = ref({
    global: { value: '', matchMode: FilterMatchMode.CONTAINS }
  })
  const isLoading = ref(false)
  const data = ref([])
  const selectedColumns = ref([])
  const informationForDeletion = ref({})
  const showActions = ref(true)

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

  const columnSelectorPanel = ref(null)
  const toggleColumnSelector = (event) => {
    columnSelectorPanel.value.toggle(event)
  }

  const onRowReorder = (event) => {
    data.value = event.value
  }

  const actionOptions = (rowData) => {
    const actionOptions = []

    if (props.rowActions && props.rowActions.length > 0) {
      props.rowActions.forEach((action) => {
        if (action.visibleAction?.(rowData)) return

        actionOptions.push({
          ...action,
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
      isLoading.value = true
      let response = null
      if (props.isGraphql) {
        response = await props.listService()
      }
      if (!props.isGraphql) {
        response = await props.listService({ page })
      }
      data.value = response
    } catch (error) {
      data.value = []
      toast.add({
        closable: true,
        severity: 'error',
        summary: error
      })
    } finally {
      isLoading.value = false
    }
  }

  const router = useRouter()

  const navigateToAddPage = () => {
    emit('on-before-go-to-add-page')
    router.push(props.createPagePath)
  }

  const menuRef = ref({})
  const toggleActionsMenu = (event, selectedID) => {
    if (!selectedID) {
      throw new Error('rowData id not found')
    }
    selectedId.value = selectedID
    menuRef.value[selectedID].toggle(event)
  }
  const editItemSelected = ({ data: item }) => {
    emit('on-before-go-to-edit')
    if (props.editInDrawer) {
      props.editInDrawer(item)
      return
    }
    if (props.enableEditClick) {
      router.push({ path: `${props.editPagePath}/${item.id}` })
    }
  }
  const openDeleteDialog = () => {
    informationForDeletion.value = {
      title: props.pageTitleDelete,
      selectedID: selectedId.value,
      deleteService: props.deleteService,
      deleteDialogVisible: true,
      rerender: Math.random()
    }
  }

  const updatedTable = () => {
    loadData({ page: 1 })
  }

  watch(data, (currentState) => {
    const hasData = currentState.length > 0
    emit('on-load-data', hasData)
  })
</script>
