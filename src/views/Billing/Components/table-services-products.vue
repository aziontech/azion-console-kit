<template>
  <DataTable
    v-model:expandedRows="expandedRows"
    :value="props.listProduct"
    rowGroupMode="subheader"
    groupRowsBy="region"
    class="w-full sm:w-1/2 h-fit"
    :pt="{
      thead: { class: 'hidden' },
      rowexpansioncell: 'p-0'
    }"
  >
    <template #header>
      <span class="text-base font-medium">Service and Products Charges</span>
    </template>
    <Column
      expander
      class="w-0"
      :pt="{
        rowToggler: { class: 'border-none' }
      }"
    />
    <Column
      field="service"
      header=""
      class="font-medium !text-base"
    ></Column>
    <Column
      field="value"
      header=""
      class="font-medium !text-sm"
      bodyStyle="text-align:right"
    ></Column>
    <template #expansion="slotProps">
      <div class="p-0 m-0">
        <DataTable
          v-for="(expansionColuns, index) in slotProps.data.descriptions"
          :key="index"
          :value="expansionColuns.data"
          class="border-none -mt-0.5 !text-sm text-color-secondary rounded-none"
        >
          <Column :pt="{ root: { class: 'pl-12' } }"></Column>
          <Column
            field="country"
            :header="expansionColuns.service"
            class="w-full pt-4 pb-4"
            :pt="{
              bodyCell: { class: 'text-color-secondary text-sm' }
            }"
          ></Column>
          <Column
            field="quantity"
            :header="expansionColuns.quantity"
            :pt="{
              root: { class: 'pr-8' }
            }"
            bodyStyle="text-align:right"
          ></Column>
          <Column
            field="price"
            :header="expansionColuns.price"
            bodyStyle="text-align:right"
          ></Column>
        </DataTable>
      </div>
    </template>
  </DataTable>
</template>
<script setup>
  import { ref } from 'vue'
  import DataTable from 'primevue/datatable'
  import Column from 'primevue/column'

  defineOptions({
    name: 'table-services-products'
  })

  const props = defineProps({
    listProduct: {
      type: Array,
      required: true
    }
  })

  const expandedRows = ref([])
</script>
