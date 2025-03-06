<template>
  <div class="mt-4">
    <DataTable
      :value="data"
      v-model:filters="filters"
    >
      <template #header>
        <span
          class="flex flex-row p-input-icon-left items-center max-w-xs"
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
      </template>
      <Column
        field="key"
        header="Field"
        style="min-width: 40%"
      ></Column>
      <Column
        field="value"
        header="Value"
        style="width: 60%"
      ></Column>
    </DataTable>
  </div>
</template>
<script setup>
  import DataTable from 'primevue/datatable'
  import Column from 'primevue/column'
  import { FilterMatchMode } from 'primevue/api'
  import InputText from 'primevue/inputtext'

  import { ref } from 'vue'

  defineProps({
    data: {
      type: Array,
      default: () => []
    }
  })

  const filters = ref({
    global: { value: '', matchMode: FilterMatchMode.CONTAINS }
  })
</script>
