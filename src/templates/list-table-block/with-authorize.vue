<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock :pageTitle="pageTitle" />
    </template>
    <template #content>
      <div class="max-w-full">
        <DataTable
          v-if="!isLoading"
          class="overflow-clip rounded-md"
          @rowReorder="onRowReorder"
          scrollable
          removableSort
          :value="data"
          dataKey="id"
          v-model:filters="this.filters"
          paginator
          :rowsPerPageOptions="[10, 20, 50, 100]"
          :rows="10"
          :globalFilterFields="filterBy"
          :loading="isLoading"
          v-model:selection="selectedRow"
          selectionMode="single"
          @row-click="editItemSelected"
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
                  icon="pi pi-bars"
                  @click="toggleColumnSelector"
                  v-tooltip.top="{ value: 'Hidden columns', showDelay: 200 }"
                >
                </PrimeButton>
                <OverlayPanel ref="columnSelectorPanel">
                  <Listbox
                    v-model="selectedColumns"
                    multiple
                    :options="[{ label: 'Hidden columns', items: this.columns }]"
                    class="hidden-columns-panel"
                    optionLabel="header"
                    optionGroupLabel="label"
                    optionGroupChildren="items"
                  >
                    <template #optiongroup="slotProps">
                      <p class="text-sm font-bold">{{ slotProps.option.label }}</p>
                    </template>
                  </Listbox>
                </OverlayPanel>
              </div>
            </template>
            <template #body="{ data: rowData }">
              <div class="flex justify-end">
                <PrimeMenu
                  :ref="'menu'"
                  id="overlay_menu"
                  v-bind:model="actionOptions()"
                  :popup="true"
                />
                <PrimeButton
                  v-tooltip.top="{ value: 'Actions', showDelay: 200 }"
                  size="small"
                  icon="pi pi-ellipsis-h"
                  text
                  @click="(event) => toggleActionsMenu(event, rowData.id)"
                  class="cursor-pointer"
                />
              </div>
            </template>
          </Column>
          <template #empty>
            <div class="my-4 flex flex-col gap-3 justify-center items-center">
              <p class="text-xl font-normal text-gray-600">No registers found.</p>
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
  </ContentBlock>
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
  import ContentBlock from '@/templates/content-block/ContentBlock.vue'

  export default {
    name: 'list-table-block',
    emits: ['on-load-data', 'authorize-edge-node'],
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
      DeleteDialog,
      ContentBlock
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
      pageTitle: {
        type: String,
        required: true
      },
      pageTitleDelete: {
        type: String,
        required: true
      },
      createPagePath: {
        type: String,
        required: false,
        default: () => '/'
      },
      editPagePath: {
        type: String,
        required: true,
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
        required: true,
        type: Function
      },
      reorderableRows: {
        required: false,
        type: Boolean,
        default: false
      }
    },
    async created() {
      await this.loadData({ page: 1 })
      this.selectedColumns = this.columns
    },
    computed: {
      filterBy() {
        return this.columns.map((item) => item.field)
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
      actionOptions() {
        const actionOptions = [
          {
            label: 'Delete',
            icon: 'pi pi-fw pi-trash',
            command: () => this.openDeleteDialog()
          },
          {
            label: 'Authorize',
            icon: 'pi pi-fw pi-check-square',
            command: () => this.authorize()
          }
        ]

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
        this.$refs.menu.toggle(event)
      },
      editItemSelected({ data: item }) {
        this.$router.push({ path: `${this.editPagePath}/${item.id}` })
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
      },
      authorize() {
        this.$emit('authorizeEdgeNode', {
          authorize: { edgeNodeID: this.selectedId, openDialog: true, rerender: Math.random() }
        })
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
