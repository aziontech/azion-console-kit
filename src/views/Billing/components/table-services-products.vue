<template>
  <SkeletonBlock
    v-if="props.isLoading"
    class="w-full sm:w-1/2 h-[200px]"
  />
  <DataTable
    v-else
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
      class="font-medium !text-base"
    />
    <Column
      field="value"
      class="font-medium !text-sm"
      bodyStyle="text-align:right"
      v-if="accountIsNotRegular"
    />
    <template #expansion="slotProps">
      <div class="p-0 m-0">
        <DataTable
          v-for="(expansionColuns, index) in slotProps.data.descriptions"
          :key="index"
          :value="expansionColuns.data"
          class="border-none -mt-0.5 !text-sm text-color-secondary rounded-none"
        >
          <Column :pt="{ root: { class: 'pl-12' } }" />
          <Column
            field="country"
            :header="expansionColuns.service"
            class="w-full pt-4 pb-4"
            :pt="{
              bodyCell: { class: 'text-color-secondary text-sm' }
            }"
          />
          <Column
            field="quantity"
            :header="expansionColuns.quantity"
            :pt="{
              root: { class: 'pr-8' }
            }"
            bodyStyle="text-align:right"
          />
          <Column
            field="price"
            :header="expansionColuns.price"
            bodyStyle="text-align:right"
            v-if="accountIsNotRegular"
          />
        </DataTable>
      </div>
    </template>
  </DataTable>
</template>

<script setup>
  import { ref } from 'vue'
  import DataTable from 'primevue/datatable'
  import Column from 'primevue/column'
  import SkeletonBlock from '@/templates/skeleton-block'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'

  const accountStore = useAccountStore()

  const { accountIsNotRegular } = storeToRefs(accountStore)

  defineOptions({
    name: 'table-services-products'
  })

  const props = defineProps({
    listProduct: {
      type: Array,
      required: true
    },
    isLoading: {
      type: Boolean,
      default: false
    }
  })

  const expandedRows = ref([])
</script>
