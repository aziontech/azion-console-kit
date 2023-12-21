<template>
  <div>
    <div class="max-w-full mt-4">
      <DataTable
        v-if="!isLoading"
        scrollable
        removableSort
        :value="data"
        dataKey="id"
        v-model:filters="this.filters"
        :paginator="showPagination"
        :rowsPerPageOptions="[10, 20, 50, 100]"
        :rows="minimumOfItemsPerPage"
        :globalFilterFields="filterBy"
        :loading="isLoading"
        selectionMode="single"
        @row-click="editItemSelected"
        @rowReorder="onRowReorder"
        :pt="pt"
      >
        <template #header>
          <div class="flex flex-wrap justify-between gap-2 w-full">
            <span class="p-input-icon-left max-sm:w-full">
              <i class="pi pi-search" />
              <InputText
                class="w-full"
                v-model.trim="this.filters.global.value"
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
          v-for="col of columns"
          :key="col.field"
          :field="col.field"
          :header="col.header"
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
        >
          <template #body="{ data: rowData }">
            <div class="flex justify-end">
              <PrimeMenu
                :ref="'menu'"
                id="overlay_menu"
                v-bind:model="actionOptions(rowData?.status)"
                :popup="true"
              />
              <PrimeButton
                v-tooltip.top="{ value: 'Actions', showDelay: 200 }"
                size="small"
                icon="pi pi-ellipsis-h"
                text
                @click="(event) => toggleActionsMenu(event, rowData)"
                class="cursor-pointer table-button"
              />
            </div>
          </template>
        </Column>
        <template #empty>
          <slot name="empty">
            <div class="my-4 flex flex-col gap-3 justify-center items-center">
              <p class="text-xl font-normal text-secondary">No registers found.</p>
              <PrimeButton
                v-if="!authorizeNode"
                text
                icon="pi pi-plus"
                label="Add"
                @click="navigateToAddPage"
              />
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
      >
        <template #header>
          <div class="flex self-start">
            <span class="p-input-icon-left">
              <i class="pi pi-search" />
              <InputText
                class="w-full"
                v-model="this.filters.global.value"
                placeholder="Search"
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
  </div>
</template>

<script>
  import DataTable from 'primevue/datatable'
  import Column from 'primevue/column'
  import InputText from 'primevue/inputtext'
  import PrimeMenu from 'primevue/menu'
  import Skeleton from 'primevue/skeleton'
  import PrimeButton from 'primevue/button'
  import { FilterMatchMode } from 'primevue/api'
  import DeleteDialog from './dialog/delete-dialog'
  import { getArrayChangedIndices } from '@/helpers/get-array-changed-indices'

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
      DeleteDialog
    },
    data: () => ({
      showActionsMenu: false,
      selectedId: null,
      filters: {
        global: { value: '', matchMode: FilterMatchMode.CONTAINS }
      },
      isLoading: false,
      data: [],
      minimumOfItemsPerPage: 10,
      informationForDeletion: {},
      selectedItemData: null
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
        type: Boolean,
        required: false,
        default: false
      },
      listService: {
        required: true,
        type: Function
      },
      deleteService: {
        required: true,
        type: Function
      },
      onReorderService: {
        required: true,
        type: Function
      },
      reorderableRows: {
        required: false,
        type: Boolean,
        default: false
      },
      pt: {
        type: Object,
        required: false
      }
    },
    async created() {
      await this.loadData({ page: 1 })
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
      actionOptions(showAuthorize) {
        const actionOptions = [
          {
            label: 'Delete',
            icon: 'pi pi-fw pi-trash',
            command: () => this.openDeleteDialog()
          }
        ]
        if (this.authorizeNode && showAuthorize !== 'Authorized') {
          actionOptions.push({
            label: 'Authorize',
            icon: 'pi pi-lock-open',
            command: () => this.authorizeEdgeNode()
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
          this.data = []
          this.$toast.add({
            closable: true,
            severity: 'error',
            summary: error
          })
        } finally {
          this.isLoading = false
        }
      },
      async reload() {
        await this.loadData({ page: 1 })
      },
      navigateToAddPage() {
        this.$router.push(this.createPagePath)
      },
      toggleActionsMenu(event, selectedItemData) {
        this.selectedItemData = selectedItemData
        this.selectedId = selectedItemData.id
        this.$refs.menu.toggle(event)
      },
      editItemSelected({ data: item }) {
        if (this.editInDrawer) {
          this.editInDrawer(item)
          return
        }
        this.$router.push({ path: `${this.editPagePath}/${item.id}` })
      },
      authorizeEdgeNode() {
        this.$emit('authorize', this.selectedId)
      },
      openDeleteDialog() {
        this.informationForDeletion = {
          title: this.pageTitleDelete,
          selectedID: this.selectedId,
          selectedItemData: this.selectedItemData,
          deleteService: this.deleteService,
          deleteDialogVisible: true,
          rerender: Math.random()
        }
      },
      updatedTable() {
        this.data = this.data.filter((item) => item.id !== this.selectedId)
        this.$forceUpdate()
      },
      async onRowReorder(event) {
        try {
          const tableData = getArrayChangedIndices(this.data, event.value)
          await this.onReorderService(tableData)
          this.data = event.value

          this.$toast.add({
            closable: true,
            severity: 'success',
            summary: 'Rules Engine order saved!'
          })
        } catch (error) {
          this.$toast.add({
            closable: true,
            severity: 'error',
            summary: error
          })
        }
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
