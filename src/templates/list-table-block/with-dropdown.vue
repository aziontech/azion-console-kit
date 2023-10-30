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
        :value="listAccounts"
        lazy
        paginator
        :first="0"
        :rows="limitShowRows"
        @rowSelect="onRowSelect"
        selectionMode="single"
        scrollable
        removableSort
        :rowsPerPageOptions="[5, 10, 20, 50, 100]"
        @page="onPage($event)"
        :totalRecords="totalRecords"
        :loading="isLoading"
        :pt="{
          root: { class: 'border rounded' },
          header: { class: 'rounded' }
        }"
      >
        <template #header>
          <div class="flex flex-wrap justify-between gap-2 w-full rounded">
            <span class="p-input-icon-left max-sm:w-full">
              <i class="pi pi-search" />
              <InputText
                class="w-[340px]"
                v-model="snippet"
                @keyup.enter="searchFilter"
                placeholder="Search"
              />
            </span>

            <Dropdown
              @update:modelValue="selectedTypeAccount"
              :options="filterType"
              class="w-[216px]"
              optionLabel="label"
              optionValue="value"
              v-model="typeSelected"
            />
          </div>
        </template>
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
          root: { class: 'border rounded' },
          header: { class: 'rounded' }
        }"
      >
        <template #header>
          <div class="flex flex-wrap justify-between gap-2 w-full rounded">
            <span class="p-input-icon-left max-sm:w-full">
              <i class="pi pi-search" />
              <InputText
                class="w-[340px]"
                v-model="snippet"
                placeholder="Search"
                @keyup.enter="searchFilter"
              />
            </span>

            <Dropdown
              :options="filterType"
              class="w-[216px]"
              optionLabel="label"
              optionValue="value"
              v-model="typeSelected"
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
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import DataTable from 'primevue/datatable'
  import Column from 'primevue/column'
  import { useToast } from 'primevue/usetoast'
  import Listbox from 'primevue/listbox'
  import InputText from 'primevue/inputtext'
  import Skeleton from 'primevue/skeleton'
  import OverlayPanel from 'primevue/overlaypanel'
  import PrimeButton from 'primevue/button'
  import Dropdown from 'primevue/dropdown'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'

  const emit = defineEmits(['selectedAccount'])
  const props = defineProps({
    pageTitle: {
      type: String,
      required: true
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
    }
  })

  const isLoading = ref(false)
  const listAccounts = ref([])
  const selectedColumns = ref([])
  const totalRecords = ref()
  const snippet = ref('')
  const columnSelectorPanel = ref()
  const columns = ref([
    { field: 'name', header: 'Name' },
    {
      field: 'type',
      header: 'Type',
      type: 'component',
      component: (columnData) =>
        columnBuilder({
          data: columnData,
          columnAppearance: 'tag'
        })
    },
    { field: 'id', header: 'ID' }
  ])

  const filterType = ref([
    { label: 'Brands', value: 'brands' },
    { label: 'Resellers', value: 'resellers' },
    { label: 'Groups', value: 'groups' },
    { label: 'Clients', value: 'clients' }
  ])

  const typeSelected = ref('brands')

  onMounted(async () => {
    await loadData({ page: 1 })
    selectedColumns.value = columns.value
  })

  const toggleColumnSelector = (event) => {
    columnSelectorPanel.value.toggle(event)
  }

  const toast = useToast()
  const loadData = async ({ page, snippet = '' }) => {
    try {
      isLoading.value = true
      const type = typeSelected.value
      const { accounts, totalPages } = await props.listService({ page, type, snippet })
      totalRecords.value = totalPages * props.limitShowRows
      listAccounts.value = accounts
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

  const onRowSelect = (event) => {
    emit('selectedAccount', event.data)
  }

  const onPage = (event) => {
    loadData({ page: event.page + 1 })
  }

  const selectedTypeAccount = (typeAccount) => {
    typeSelected.value = typeAccount
    loadData({ page: 1 })
  }

  const searchFilter = () => {
    loadData({ page: 1, snippet: snippet.value })
  }
</script>
