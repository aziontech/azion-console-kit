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
      :rows="minimumOfItemsPerPage"
      :globalFilterFields="filterBy"
      :loading="isLoading"
    >
      <template #header>
        <div class="flex flex-wrap justify-between gap-2 w-full">
          <span class="p-input-icon-left max-sm:w-full">
            <i class="pi pi-search" />
            <InputText
              class="w-full"
              v-model="this.filters.global.value"
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
            <div v-html="rowData[col.field]" />
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
            <OverlayPanel ref="columnSelectorPanel">
              <Listbox
                v-model="selectedColumns"
                multiple
                :options="[{ label: 'Hidden Columns', items: this.columns }]"
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
          <div class="flex justify-end">
            <PrimeMenu
              :ref="`menu-${rowData.id}`"
              id="overlay_menu"
              v-bind:model="actionOptions(rowData)"
              :popup="true"
            />
            <PrimeButton
              v-tooltip.top="{ value: 'Actions', showDelay: 200 }"
              size="small"
              icon="pi pi-ellipsis-h"
              text
              @click="(event) => toggleActionsMenu(event, rowData.id)"
              class="cursor-pointer table-button"
            />
          </div>
        </template>
      </Column>
      <template #empty>
        <div class="my-4 flex flex-col gap-3 justify-center items-center">
          <p class="text-xl font-normal text-secondary">No registers found.</p>
          <PrimeButton
            text
            icon="pi pi-plus"
            label="Add"
            v-if="addButtonLabel"
            @click="navigateToAddPage"
          />
        </div>
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
          <span class="p-input-icon-left max-sm:w-full">
            <i class="pi pi-search" />
            <InputText
              class="w-full"
              v-model="this.filters.global.value"
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
          <Skeleton></Skeleton>
        </template>
      </Column>
    </DataTable>
  </div>
  <DeleteDialog
    :informationForDeletion="informationForDeletion"
    @successfullyDeleted="updatedTable()"
  />
</template>

<script>
  import DataTable from 'primevue/datatable'
  import Column from 'primevue/column'
  import Listbox from 'primevue/listbox'
  import InputText from 'primevue/inputtext'
  import PrimeMenu from 'primevue/menu'
  import Skeleton from 'primevue/skeleton'
  import OverlayPanel from 'primevue/overlaypanel'
  import PrimeButton from 'primevue/button'
  import { FilterMatchMode } from 'primevue/api'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import DeleteDialog from './dialog/delete-dialog'

  export default {
    name: 'list-table-block',
    emits: ['on-load-data'],
    components: {
      DataTable,
      Column,
      InputText,
      PrimeButton,
      PrimeMenu,
      Skeleton,
      Listbox,
      OverlayPanel,
      PageHeadingBlock,
      DeleteDialog
    },
    data: () => ({
      selectedId: null,
      filters: {
        global: { value: '', matchMode: FilterMatchMode.CONTAINS }
      },
      isLoading: false,
      showColumnSelector: false,
      data: [],
      selectedColumns: [],
      minimumOfItemsPerPage: 10,
      informationForDeletion: {}
    }),
    props: {
      columns: {
        type: Array,
        required: true,
        default: () => [
          {
            field: 'name',
            header: 'Name'
          }
        ]
      },
      pageTitleDelete: {
        type: String,
        required: true
      },
      createPagePath: {
        type: String,
        required: true,
        default: () => '/'
      },
      editPagePath: {
        type: String,
        default: () => '/'
      },
      addButtonLabel: {
        type: String,
        required: true,
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
        required: false,
        type: Boolean,
        default: false
      },
      rowActions: {
        type: Array,
        default: () => []
      }
    },
    async created() {
      await this.loadData({ page: 1 })
      this.selectedColumns = this.columns
    },
    computed: {
      filterBy() {
        return this.columns.map((item) => item.field)
      },
      showPagination() {
        return this.data.length > this.minimumOfItemsPerPage
      }
    },
    methods: {
      toggleColumnSelector(event) {
        this.$refs.columnSelectorPanel.toggle(event)
      },
      toggleShowColumnSelector() {
        this.showColumnSelector = !this.showColumnSelector
      },
      onRowReorder(event) {
        this.data = event.value
      },
      addActionOption(actionOptions, option) {
        actionOptions.push({
          ...option
        })
      },
      actionOptions(rowData) {
        const actionOptions = []

        if (this.deleteService) {
          actionOptions.push({
            label: 'Delete',
            icon: 'pi pi-fw pi-trash',
            command: () => this.openDeleteDialog()
          })
        }

        if (this.rowActions && this.rowActions.length > 0) {
          this.rowActions.forEach((action) => {
            actionOptions.push({
              ...action,
              command: () => action.command(rowData)
            })
          })
        }

        return actionOptions
      },
      async loadData({ page }) {
        try {
          this.isLoading = true
          const data = await this.listService({ page })
          this.data = data
        } catch (error) {
          this.$toast.add({
            closable: false,
            severity: 'error',
            summary: error,
            life: 10000
          })
        } finally {
          this.isLoading = false
        }
      },
      navigateToAddPage() {
        this.$router.push(this.createPagePath)
      },
      toggleActionsMenu(event, selectedId) {
        this.selectedId = selectedId
        this.$refs[`menu-${selectedId}`].toggle(event)
      },
      editItemSelected({ data: item }) {
        if (this.enableEditClick) {
          this.$router.push({ path: `${this.editPagePath}/${item.id}` })
        }
      },
      openDeleteDialog() {
        this.informationForDeletion = {
          title: this.pageTitleDelete,
          selectedID: this.selectedId,
          deleteService: this.deleteService,
          deleteDialogVisible: true,
          rerender: Math.random()
        }
      },
      updatedTable() {
        this.data = this.data.filter((item) => item.id !== this.selectedId)
        this.$forceUpdate()
      }
    },
    watch: {
      data(currentState) {
        const hasData = currentState.length > 0
        this.$emit('on-load-data', hasData)
      }
    }
  }
</script>
