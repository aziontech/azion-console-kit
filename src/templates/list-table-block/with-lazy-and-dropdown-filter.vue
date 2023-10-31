<template>
  <div>
    <div class="max-w-full">
      <div
        class="flex flex-col items-start gap-2 mb-4 self-stretch w-full"
        v-if="pageTitle || description"
      >
        <div
          class="self-stretch text-[var(--text-color)] text-xl not-italic font-medium leading-7"
          v-if="pageTitle"
        >
          {{ pageTitle }}
        </div>
        <div
          class="self-stretch text-[var(--text-color-secondary)] text-sm not-italic font-normal leading-[normal]"
          v-if="description"
        >
          {{ description }}
        </div>
      </div>

      <DataTable
        v-show="!isLoading"
        dataKey="id"
        ref="tableSwitch"
        :value="listRecords"
        lazy
        :paginator="totalRecords > limitShowRows"
        :rows="limitShowRows"
        scrollable
        removableSort
        @page="onPage($event)"
        :totalRecords="totalRecords"
        :loading="isLoading"
        :pt="{
          root: { class: 'border surface-border rounded' },
          header: { class: 'rounded' }
        }"
      >
        <template #header>
          <slot
            name="headerColumn"
            :filter="filters"
            :applyFilter="loadData"
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
            <p class="text-xl font-normal text-gray-600">No registers found.</p>
          </div>
        </template>
      </DataTable>

      <DataTable
        v-if="isLoading"
        :value="Array(5)"
        removableSort
        :pt="{
          root: { class: 'border surface-border rounded' },
          header: { class: 'rounded' }
        }"
      >
        <template #header>
          <slot
            name="headerColumn"
            :filter="filters"
            :applyFilter="loadData"
          />
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
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import DataTable from 'primevue/datatable'
  import Column from 'primevue/column'
  import { useToast } from 'primevue/usetoast'
  import Listbox from 'primevue/listbox'
  import Skeleton from 'primevue/skeleton'
  import OverlayPanel from 'primevue/overlaypanel'
  import PrimeButton from 'primevue/button'

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
    filterHeader: {
      required: false,
      type: Object,
      default: () => ({})
    }
  })

  const isLoading = ref(false)
  const listRecords = ref([])
  const filters = ref(props.filterHeader)
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

  const toast = useToast()
  const loadData = async ({ page = props.pageInitial } = {}) => {
    try {
      isLoading.value = true
      listRecords.value = []
      const { results, totalPages } = await props.listService({
        page,
        ...filters.value
      })
      totalRecords.value = totalPages * props.limitShowRows
      listRecords.value = results
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error,
        life: 10000
      })
    } finally {
      isLoading.value = false
    }
  }

  const onPage = (event) => {
    loadData({ page: event.page + props.pageInitial })
  }
</script>
