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
                <CopyBlock
                  :value="invoiceData?.billDetailId"
                  v-if="invoiceData?.billDetailId"
                />
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
          </div>
        </div>
      </div>
    </template>
  </ContentBlock>
</template>

<script setup>
  import { onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'
  import ContentBlock from '@/templates/content-block'
  import SkeletonBlock from '@/templates/skeleton-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import CopyBlock from '@aziontech/webkit/button-copy'
  import TableServicesProducts from './components/table-services-products'
  import { listServiceAndProductsChangesAccountingService } from '@/services/billing-services'

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
    }
  })

  const route = useRoute()
  const router = useRouter()
  const accountStore = useAccountStore()

  const { accountIsNotRegular } = storeToRefs(accountStore)

  const invoiceData = ref({})
  const isInvoiceDataLoaded = ref(true)
  const listServiceProducts = ref([])
  const isServiceProductsLoading = ref(true)

  onMounted(() => {
    listServiceAndProductsChanges()
    loadInvoiceData()
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
      const products = await listServiceAndProductsChangesAccountingService(route.params.billId)

      listServiceProducts.value = products?.length ? products : DEFAULT_PRODUCTS_LIST
    } catch (error) {
      listServiceProducts.value = DEFAULT_PRODUCTS_LIST
    } finally {
      isServiceProductsLoading.value = false
    }
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
