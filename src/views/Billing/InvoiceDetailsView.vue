<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Invoice Details" />
    </template>
    <template #content>
      <div class="w-full flex flex-col-reverse sm:flex-row gap-6">
        <DataTable
          v-model:expandedRows="expandedRows"
          :value="data"
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
              <span class="font-medium text-color text-sm">---</span>
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
              <span
                v-if="cardDefault.cardData"
                class="flex gap-2 text-color-secondary text-sm"
              >
                <cardFlagBlock :cardFlag="cardDefault.cardData.cardBrand" />
                {{ cardDefault.cardData.cardNumber }}
              </span>
              <span
                v-else
                class="text-color-secondary text-sm"
                >---</span
              >
            </div>
            <div class="flex justify-between">
              <span class="text-color-secondary text-sm">Billing Period</span>
              <span class="font-medium text-color text-sm">{{ invoiceData.billingPeriod }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-color-secondary text-sm">Products Charges</span>
              <span class="text-color text-sm"> {{ invoiceData.productChanges }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-color-secondary text-sm">Professional Services Plan Charges</span>
              <span class="text-color text-sm"> {{ invoiceData.servicePlan }}</span>
            </div>
          </div>

          <div class="p-3 md:p-6 flex flex-col gap-4 border-t surface-border">
            <div class="flex justify-between">
              <span class="text-color-secondary text-sm">Credit Used for Payment</span>
              <span class="text-color">
                <span class="text-color-secondary text-sm">$</span>
                {{ invoiceData.creditUsedForPayment }}</span
              >
            </div>
            <div class="flex justify-between">
              <span class="text-color-secondary text-sm flex items-center gap-3">
                <b class="font-medium text-2xl text-color"> Total </b>
                (Amount Payable)
              </span>
              <span class="font-medium text-2xl">
                <span class="text-color-secondary text-sm font-medium">$</span>
                {{ invoiceData.total }}</span
              >
            </div>
          </div>
        </div>
      </div>
    </template>
  </ContentBlock>
</template>

<script setup>
  import { onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import { useToast } from 'primevue/usetoast'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import PrimeButton from 'primevue/button'
  import cardFlagBlock from '@templates/card-flag-block'
  import DataTable from 'primevue/datatable'
  import Column from 'primevue/column'

  const props = defineProps({
    loadInvoiceDataService: {
      type: Function,
      required: true
    },
    loadPaymentMethodDefaultService: {
      type: Function,
      required: true
    },
    listServiceAndProductsChangesService: {
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
  const cardDefault = ref({})
  const data = ref([])
  const expandedRows = ref([])

  onMounted(() => {
    listServiceAndProductsChanges()
    loadInvoiceData()
    loadCardDefault()
  })

  const loadInvoiceData = async () => {
    try {
      invoiceData.value = await props.loadInvoiceDataService(route.params.billId)
    } catch (error) {
      invoiceData.value = null
    }
  }

  const listServiceAndProductsChanges = async () => {
    try {
      data.value = await props.listServiceAndProductsChangesService(route.params.billId)
    } catch (error) {
      data.value = []
    }
  }

  const loadCardDefault = async () => {
    try {
      cardDefault.value = await props.loadPaymentMethodDefaultService()
    } catch (error) {
      cardDefault.value = null
    }
  }

  const clipboard = (content) => {
    props.clipboardWrite(content)
    toast.add({
      closable: true,
      severity: 'success',
      summary: 'Successfully copied!'
    })
  }
</script>
