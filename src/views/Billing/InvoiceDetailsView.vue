<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Invoice Details" />
    </template>
    <template #content>
      <div class="mb-4">
        <slot
          name="notification"
          :redirectLink="redirectPayment"
        />
      </div>
      <div class="w-full flex flex-col-reverse sm:flex-row gap-6">
        <TableServicesProducts
          :listProduct="listServiceProducts"
          :isLoading="isServiceProductsLoading"
        />
        <div class="w-full sm:w-1/2 flex flex-col h-max border surface-border rounded-md">
          <div class="p-3 md:p-6 flex flex-col gap-4">
            <div class="flex justify-between">
              <span class="font-medium text-lg text-color">Invoice Data</span>
              <PrimeButton
                icon="pi pi-download"
                outlined
                size="small"
                label="Export"
                @click="invoiceDownload"
                :disabled="invoiceData?.disabledExport"
              />
            </div>
            <div class="flex justify-between mt-4">
              <span class="text-color-secondary text-sm">Payment Data</span>
              <SkeletonBlock
                :isLoaded="isInvoiceDataLoaded"
                class="font-medium text-color text-sm"
              >
                <span>---</span>
              </SkeletonBlock>
            </div>
            <div
              class="flex justify-between items-center"
              v-if="!invoiceData?.temporaryBill"
            >
              <span class="text-color-secondary text-sm">Invoice ID</span>
              <SkeletonBlock
                :isLoaded="isInvoiceDataLoaded"
                width="10rem"
                class="flex gap-3 items-center"
              >
                <span
                  class="font-medium text-color text-sm"
                  v-if="accountIsNotRegular"
                  >{{ invoiceData?.billDetailId }}</span
                >
                <span
                  class="font-medium text-color text-sm"
                  v-else
                  >{{ invoiceData?.billId }}</span
                >
                <PrimeButton
                  icon="pi pi-copy"
                  outlined
                  v-if="invoiceData?.billDetailId"
                  @click="clipboard(invoiceData.billDetailId)"
                />
              </SkeletonBlock>
            </div>
            <div
              class="flex justify-between"
              v-if="accountIsNotRegular"
            >
              <span class="text-color-secondary text-sm">Payment Method</span>
              <SkeletonBlock
                :isLoaded="isCardDefaultLoaded"
                class="flex gap-3 items-center"
                width="8rem"
                sizeHeight="small"
                elementType="span"
              >
                <span
                  v-if="cardDefault.cardData"
                  class="flex gap-2 text-color font-medium text-sm"
                >
                  <cardFlagBlock :cardFlag="cardDefault.cardData.cardBrand" />
                  {{ cardDefault.cardData.cardNumber }}
                </span>
                <span v-else>---</span>
              </SkeletonBlock>
            </div>
            <div class="flex justify-between">
              <span class="text-color-secondary text-sm">Billing Period</span>
              <SkeletonBlock
                width="10rem"
                :isLoaded="isInvoiceDataLoaded"
                class="font-medium text-color text-sm"
              >
                {{ invoiceData?.billingPeriod }}
              </SkeletonBlock>
            </div>
            <div
              class="flex justify-between"
              v-if="accountIsNotRegular"
            >
              <span class="text-color-secondary text-sm">Products Charges</span>
              <SkeletonBlock
                :isLoaded="isInvoiceDataLoaded"
                class="text-color text-sm"
              >
                {{ invoiceData?.productChanges }}
              </SkeletonBlock>
            </div>
            <div
              class="flex justify-between"
              v-if="accountIsNotRegular"
            >
              <span class="text-color-secondary text-sm">Professional Services Plan Charges</span>
              <SkeletonBlock
                :isLoaded="isInvoiceDataLoaded"
                class="text-color text-sm"
              >
                {{ invoiceData?.servicePlan }}
              </SkeletonBlock>
            </div>
          </div>

          <div
            class="p-3 md:p-6 flex flex-col gap-4 border-t surface-border"
            v-if="accountIsNotRegular"
          >
            <div class="flex justify-between">
              <span class="text-color-secondary text-sm">Credit Used for Payment</span>
              <SkeletonBlock
                :isLoaded="isInvoiceDataLoaded"
                class="text-color"
              >
                <span class="text-color-secondary text-sm">$</span>
                {{ invoiceData?.creditUsedForPayment }}
              </SkeletonBlock>
            </div>
            <div class="flex justify-between">
              <span class="text-color-secondary text-sm flex items-center gap-3">
                <b class="font-medium text-2xl text-color"> Total </b>
                (Amount Payable)
              </span>
              <SkeletonBlock
                sizeHeight="medium"
                width="8rem"
                :isLoaded="isInvoiceDataLoaded"
                class="font-medium flex items-center gap-1"
              >
                <span class="text-sm">$</span>
                <span class="text-2xl">
                  {{ invoiceData?.total }}
                </span>
              </SkeletonBlock>
            </div>
          </div>
        </div>
      </div>
    </template>
  </ContentBlock>
</template>

<script setup>
  import { onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from 'primevue/usetoast'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'
  import ContentBlock from '@/templates/content-block'
  import SkeletonBlock from '@/templates/skeleton-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import PrimeButton from 'primevue/button'
  import cardFlagBlock from '@templates/card-flag-block'
  import TableServicesProducts from './components/table-services-products'
  import { listServiceAndProductsChangesAccountingService } from '@/services/billing-services'
  import { windowOpen } from '@/helpers/window-open'

  const DEFAULT_PRODUCTS_LIST = [
    {
      region: 'Global',
      service: 'No services found',
      value: '0.00',
      descriptions: [
        {
          service: 'Details',
          data: [
            {
              country: 'No usage data available'
            }
          ]
        }
      ]
    }
  ]

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
    loadCurrentInvoiceService: {
      type: Function,
      required: true
    },
    clipboardWrite: {
      type: Function,
      required: true
    }
  })

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()
  const accountStore = useAccountStore()

  const { accountIsNotRegular } = storeToRefs(accountStore)

  const invoiceData = ref({})
  const cardDefault = ref({})
  const isInvoiceDataLoaded = ref(true)
  const isCardDefaultLoaded = ref(true)
  const listServiceProducts = ref([])
  const isServiceProductsLoading = ref(true)

  onMounted(() => {
    listServiceAndProductsChanges()
    loadInvoiceData()
    loadCardDefault()
  })

  const loadInvoiceData = async () => {
    isInvoiceDataLoaded.value = false
    try {
      invoiceData.value = await props.loadInvoiceDataService(route.params.billId)
    } catch {
      invoiceData.value = null
    } finally {
      isInvoiceDataLoaded.value = true
    }
  }

  const listServiceAndProductsChanges = async () => {
    isServiceProductsLoading.value = true
    try {
      const products = accountIsNotRegular.value
        ? await props.listServiceAndProductsChangesService(route.params.billId)
        : await listServiceAndProductsChangesAccountingService(route.params.billId)

      listServiceProducts.value = products?.length ? products : DEFAULT_PRODUCTS_LIST
    } catch (error) {
      listServiceProducts.value = DEFAULT_PRODUCTS_LIST
    } finally {
      isServiceProductsLoading.value = false
    }
  }

  const loadCardDefault = async () => {
    isCardDefaultLoaded.value = false
    try {
      cardDefault.value = await props.loadPaymentMethodDefaultService()
    } catch {
      cardDefault.value = null
    } finally {
      isCardDefaultLoaded.value = true
    }
  }

  const clipboard = (content) => {
    props.clipboardWrite(content)
    toast.add({
      closable: true,
      severity: 'success',
      summary: 'Success',
      detail: 'Successfully copied!'
    })
  }

  const invoiceDownload = () => {
    windowOpen(invoiceData.value.invoiceDownloadURL, '_blank')
  }

  const redirectPayment = () => {
    const routerPayment = {
      name: 'billing-tabs',
      params: {
        tab: 'payment'
      }
    }

    router.push(routerPayment)
  }
</script>
