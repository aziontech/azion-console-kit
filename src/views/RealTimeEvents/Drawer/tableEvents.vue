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
      >
        <template #body="slotProps">
          <div
            v-if="slotProps.data.value?.type === 'clipboard'"
            class="flex gap-4 items-center w-full"
          >
            <div
              class="w-full max-w-[200px] sm:max-w-sm overflow-y-scroll p-2"
              data-testid="data-table-value"
            >
              {{ slotProps.data.value.value }}
            </div>
            <PrimeButton
              outlined
              icon="pi pi-copy"
              class="max-md:w-full"
              @click="handleCopy(slotProps.data.value.value)"
              data-testid="data-table-copy-button"
            />
          </div>
          <div
            v-else
            class="w-full"
          >
            {{ slotProps.data.value }}
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
<script setup>
  import PrimeButton from 'primevue/button'
  import DataTable from 'primevue/datatable'
  import Column from 'primevue/column'
  import { FilterMatchMode } from 'primevue/api'
  import InputText from 'primevue/inputtext'
  import { useToast } from 'primevue/usetoast'
  import { clipboardWrite } from '@/helpers/clipboard'

  import { ref } from 'vue'

  defineProps({
    data: {
      type: Array,
      default: () => []
    }
  })

  const toast = useToast()

  const filters = ref({
    global: { value: '', matchMode: FilterMatchMode.CONTAINS }
  })

  const handleCopy = (value) => {
    clipboardWrite(value)
    toast.add({
      closable: true,
      severity: 'success',
      summary: 'Success',
      detail: 'Successfully copied!'
    })
  }
</script>
