<template>
  <div>
    <div class="max-w-full">
      <div
        class="flex flex-col items-start gap-2 mb-4 self-stretch w-full"
        v-if="pageTitle || description"
      >
        <div
          class="text-xl font-medium"
          v-if="pageTitle"
        >
          {{ pageTitle }}
        </div>
        <div
          class="text-sm font-normal leading-[normal] text-color-secondary"
          v-if="description"
        >
          {{ description }}
        </div>
      </div>
      <InlineMessage
        v-if="errorMessage"
        class="mb-4"
        severity="error"
        >{{ errorMessage }}
      </InlineMessage>

      <DataTable
        v-show="!isLoading"
        dataKey="id"
        ref="tableSwitch"
        :value="listRecords"
        lazy
        :paginator="totalRecords > limitShowRows"
        v-model:rows="limitRows"
        :rowsPerPageOptions="[10, 20, 50, 100]"
        scrollable
        removableSort
        class="p-datatable-sm"
        @rowSelect="onRowSelect"
        selectionMode="single"
        v-model:first="first"
        @page="onPage($event)"
        :totalRecords="totalRecords"
        :loading="isLoading"
        tableStyle="max-sm:min-width: 50rem"
        :pt="{
          root: { class: 'border surface-border rounded' },
          header: { class: 'p-3.5' }
        }"
      >
        <template #header>
          <slot
            name="headerFilters"
            :filter="filters"
            :applyFilter="applyFilter"
          />
        </template>
        <Column
          v-if="reOrderableRows"
          rowReorder
          headerStyle="width: 3rem"
        />
        <Column
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
              <component :is="col.component({ ...rowData[col.field], value: rowData })"></component>
            </template>
          </template>
        </Column>
        <Column
          class="p-2"
          :frozen="true"
          :alignFrozen="'right'"
        >
          <template #header>
            <div class="flex justify-end w-full">
              <PrimeButton
                outlined
                icon="pi pi-bars"
                @click="toggleColumnSelector"
                v-tooltip.left="'Hidden columns'"
              >
              </PrimeButton>
              <OverlayPanel ref="columnSelectorPanel">
                <Listbox
                  v-model="selectedColumns"
                  multiple
                  :options="[{ label: 'Hidden columns', items: columns }]"
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
        </Column>
        <template #empty>
          <div class="my-4 flex flex-col gap-3 justify-center items-center">
            <p class="text-xl font-normal text-secondary">No registers found.</p>
          </div>
        </template>
      </DataTable>

      <DataTable
        v-if="isLoading"
        :value="Array(10)"
        scrollable
        removableSort
        :pt="{
          root: { class: 'border surface-border rounded' },
          header: { class: 'rounded' }
        }"
      >
        <template #header>
          <slot
            name="headerFilters"
            :filter="filters"
            :applyFilter="applyFilter"
          />
        </template>
        <Column
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
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import DataTable from 'primevue/datatable'
  import Column from 'primevue/column'
  import Listbox from 'primevue/listbox'
  import Skeleton from 'primevue/skeleton'
  import OverlayPanel from 'primevue/overlaypanel'
  import PrimeButton from 'primevue/button'
  import InlineMessage from 'primevue/inlinemessage'

  const emit = defineEmits(['onSelectedRow'])
  const props = defineProps({
    pageTitle: {
      type: String,
      required: true
    },
    pageInitial: {
      type: Number,
      required: false,
      default: 1
    },
    description: {
      type: String,
      required: false
    },
    limitShowRows: {
      type: Number,
      required: false,
      default: 10
    },
    listService: {
      required: true,
      type: Function
    },
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
    reOrderableRows: {
      required: false,
      type: Boolean,
      default: false
    },
    headerFilter: {
      required: false,
      type: Object,
      default: () => ({})
    }
  })

  const isLoading = ref(false)
  const first = ref(1)
  const limitRows = ref(props.limitShowRows)
  const errorMessage = ref(null)
  const listRecords = ref([])
  const filters = ref(props.headerFilter)
  const selectedColumns = ref([])
  const totalRecords = ref()
  const columnSelectorPanel = ref()

  onMounted(async () => {
    await loadData()
    selectedColumns.value = props.columns
  })

  const toggleColumnSelector = (event) => {
    columnSelectorPanel.value.toggle(event)
  }

  const loadData = async ({ page = props.pageInitial, pageSize = props.limitShowRows } = {}) => {
    try {
      isLoading.value = true
      listRecords.value = []
      const { results, totalPages } = await props.listService({
        page,
        pageSize,
        ...filters.value
      })
      totalRecords.value = totalPages * props.limitShowRows
      listRecords.value = results
    } catch (error) {
      errorMessage.value = error
    } finally {
      isLoading.value = false
    }
  }

  const applyFilter = () => {    
    limitRows.value = props.limitShowRows
    first.value = 1
    loadData({ page: 1 })
  }

  const onRowSelect = (event) => {
    emit('onSelectedRow', event.data)
  }

  const onPage = (event) => {
    const page = event.page + props.pageInitial
    loadData({ page, pageSize: event.rows })
  }
</script>
