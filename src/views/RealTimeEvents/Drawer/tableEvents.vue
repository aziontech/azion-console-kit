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
        <template #body="{ data }">
          <div
            v-if="data.value?.type === 'clipboard'"
            class="flex gap-4 items-center w-full"
          >
            <div
              class="w-full max-w-[200px] sm:max-w-sm overflow-y-auto"
              data-testid="data-table-value"
              :class="hasContent(data.value.content) ?? 'p-2'"
            >
              {{ data.value.content }}
            </div>
            <CopyBlock
              :value="data.value.content"
              data-testid="data-table-copy-button"
              v-if="hasContent(data.value.content)"
            />
          </div>

          <div v-else-if="keyToFormatJson.includes(data.key)">
            <pre>{{ data.value }}</pre>
          </div>
          <div
            v-else
            class="w-full"
          >
            {{ data.value }}
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
<script setup>
  import CopyBlock from '@aziontech/webkit/button-copy'
  import DataTable from '@aziontech/webkit/datatable'
  import Column from '@aziontech/webkit/column'
  import { FilterMatchMode } from '@aziontech/webkit/api'
  import InputText from '@aziontech/webkit/inputtext'

  import { ref } from 'vue'

  defineProps({
    data: {
      type: Array,
      default: () => []
    }
  })

  const keyToFormatJson = ['stacktrace', 'requestData']

  const filters = ref({
    global: { value: '', matchMode: FilterMatchMode.CONTAINS }
  })

  const hasContent = (content) => content !== '-'
</script>
