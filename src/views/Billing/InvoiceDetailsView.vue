<template>
  <div class="w-full flex flex-col-reverse sm:flex-row gap-6 mt-6 px-8">
    <DataTable
      v-model:expandedRows="expandedRows"
      :value="data"
      rowGroupMode="subheader"
      groupRowsBy="region"
      class="w-full sm:w-1/2 h-fit"
      :pt="{
        thead: { class: 'hidden' }
      }"
    >
      <template #header>
        <span class="text-base font-medium">Service and Products Charges</span>
      </template>
      <Column
        expander
        style="width: 0px"
        :pt="{
          rowToggler: { class: '!border-none' }
        }"
      />
      <Column
        field="service"
        header=""
        class="font-medium !text-base"
      ></Column>
      <Column
        field="money"
        header=""
        class="font-medium !text-sm"
        bodyStyle="text-align:right"
      ></Column>
      <template #expansion="slotProps">
        <div class="-m-4">
          <DataTable
            :value="slotProps.data.orders"
            class="!border-none -mt-0.5 !text-sm text-color-secondary"
          >
            <Column
              :pt="{
                root: { class: 'pl-12' }
              }"
            ></Column>
            <Column
              field="country"
              style="width: 100%"
              header="Total Data Transfered (per GB)"
              :pt="{
                bodyCell: { class: 'text-color-secondary text-sm' }
              }"
            ></Column>
            <Column
              field="quantity"
              header="40 GB"
              :pt="{
                root: { class: 'pr-8' }
              }"
              bodyStyle="text-align:right"
            ></Column>
            <Column
              field="price"
              header="$ 520.00"
              bodyStyle="text-align:right"
            ></Column>
          </DataTable>
        </div>
      </template>
    </DataTable>
    <div class="w-full sm:w-1/2 flex flex-col h-max border surface-border rounded-md">
      <div class="p-3 md:p-6 flex flex-col gap-4">
        <div class="flex justify-between">
          <span class="font-medium text-lg text-color">Invoice Data</span>
          <PrimeButton
            icon="pi pi-download"
            outlined
            label="Export"
            :disabled="invoiceData.temporaryBill"
          />
        </div>
        <div
          class="flex justify-between mt-4"
          v-if="!invoiceData.temporaryBill"
        >
          <span class="text-color-secondary text-sm">Payment Data</span>
          <span class="font-medium text-color text-sm">-</span>
        </div>
        <div
          class="flex justify-between items-center"
          v-if="!invoiceData.temporaryBill"
        >
          <span class="text-color-secondary text-sm">Invoice ID</span>
          <div class="flex gap-3 items-center">
            <span class="font-medium text-color text-sm">{{ invoiceData.billDetailId }}</span>
            <PrimeButton
              icon="pi pi-copy"
              outlined
              @click="clipboard(invoiceData.billDetailId)"
            />
          </div>
        </div>
        <div class="flex justify-between">
          <span class="text-color-secondary text-sm">Payment Method</span>
          <span class="font-medium text-color text-sm">Final 4242</span>
        </div>
        <div class="flex justify-between">
          <span class="text-color-secondary text-sm">Billing Period</span>
          <span class="font-medium text-color text-sm">{{ invoiceData.billingPeriod }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-color-secondary text-sm">Product Charges</span>
          <span class="text-color text-sm">
            <span class="text-color-secondary text-sm">$</span>
            {{ invoiceData.productCharges }}
          </span>
        </div>
        <div class="flex justify-between">
          <span class="text-color-secondary text-sm">Professional Services Plan Charges</span>
          <span class="text-color text-sm">
            <span class="text-color-secondary text-sm">$</span> {{ invoiceData.servicePlan }}
          </span>
        </div>
      </div>
      <div class="p-3 md:p-6 flex flex-col gap-4 border-t surface-border">
        <div class="flex justify-between">
          <span class="text-color-secondary text-sm">Credit Used for Payment</span>
          <span class="text-color">
            <span class="text-color-secondary text-sm">$</span>
            {{ invoiceData.creditUsedForPayment }}
          </span>
        </div>
        <div class="flex justify-between">
          <span class="text-color-secondary text-sm flex items-center gap-3">
            <b class="font-medium text-2xl text-color">Total</b>
            (Amount Payable)
          </span>
          <span class="font-medium text-2xl">
            <span class="text-color-secondary text-sm font-medium">$</span>
            {{ invoiceData.total }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import PrimeButton from 'primevue/button'
  import DataTable from 'primevue/datatable'
  import Column from 'primevue/column'
  import { useToast } from 'primevue/usetoast'

  const props = defineProps({
    loadInvoiceDataService: {
      type: Function,
      required: true
    },
    clipboardWrite: {
      type: Function,
      required: true
    }
  })

  const route = useRoute()
  const toast = useToast()

  const invoiceData = ref({})

  onMounted(async () => {
    invoiceData.value = await props.loadInvoiceDataService(route.params.billId)
  })

  const clipboard = (content) => {
    props.clipboardWrite(content)
    toast.add({
      closable: true,
      severity: 'success',
      summary: 'Successfully copied!'
    })
  }

  const data = [
    {
      service: 'Edge Application',
      money: '$ 145.00',
      orders: [
        { country: 'United States', quantity: '10 GB', price: '$ 50.00' },
        { country: 'Brazil', quantity: '5 GB', price: '$ 25.00' },
        { country: 'Germany', quantity: '8 GB', price: '$ 40.00' },
        { country: 'Japan', quantity: '6 GB', price: '$ 30.00' }
      ]
    },
    {
      service: 'Application Accelerator',
      money: '$ 315.00',
      orders: [
        { country: 'United States', quantity: '20 GB', price: '$ 100.00' },
        { country: 'Canada', quantity: '15 GB', price: '$ 75.00' },
        { country: 'United Kingdom', quantity: '18 GB', price: '$ 90.00' },
        { country: 'Australia', quantity: '10 GB', price: '$ 50.00' }
      ]
    },
    {
      service: 'Load Balancer',
      money: '$ 200.00',
      orders: [
        { country: 'United States', quantity: '12 GB', price: '$ 60.00' },
        { country: 'India', quantity: '8 GB', price: '$ 40.00' },
        { country: 'France', quantity: '10 GB', price: '$ 50.00' },
        { country: 'China', quantity: '10 GB', price: '$ 50.00' }
      ]
    },
    {
      service: 'Image Processor',
      money: '$ 220.00',
      orders: [
        { country: 'United States', quantity: '14 GB', price: '$ 70.00' },
        { country: 'Italy', quantity: '9 GB', price: '$ 45.00' },
        { country: 'Spain', quantity: '11 GB', price: '$ 55.00' },
        { country: 'Mexico', quantity: '10 GB', price: '$ 50.00' }
      ]
    }
  ]

  const expandedRows = ref([])
</script>
