<template>
  <div class="w-full flex flex-col-reverse sm:flex-row gap-6 mt-4">
    <div
      class="w-full surface-section sm:w-1/2 flex flex-col justify-between border surface-border rounded-md"
    >
      <div class="p-3 md:p-6 flex flex-col gap-4">
        <div class="flex justify-between">
          <span class="font-medium text-lg text-color">Current Invoice</span>
          <PrimeButton
            icon="pi pi-file"
            outlined
            size="small"
            label="Details"
            :loading="!isCurrentInvoiceLoaded"
            @click="goToBillingDetails()"
            :disabled="disabledCurrentInvoice"
          />
        </div>
        <div class="flex justify-between mt-4">
          <span class="text-color-secondary text-sm">Billing Period</span>
          <SkeletonBlock
            width="10rem"
            :isLoaded="isCurrentInvoiceLoaded"
            class="font-medium text-color text-sm"
          >
            {{ currentInvoice.billingPeriod }}
          </SkeletonBlock>
        </div>
        <div
          class="flex justify-between"
          v-if="accountIsNotRegular"
        >
          <span class="text-color-secondary text-sm">Product Charges</span>
          <SkeletonBlock
            :isLoaded="isCurrentInvoiceLoaded"
            class="text-color text-sm"
          >
            {{ currentInvoice.productChanges }}
          </SkeletonBlock>
        </div>
        <div
          class="flex justify-between"
          v-if="accountIsNotRegular"
        >
          <span class="text-color-secondary text-sm">Professional Services Plan Charges</span>
          <SkeletonBlock
            :isLoaded="isCurrentInvoiceLoaded"
            class="text-color text-sm"
          >
            {{ currentInvoice.servicePlan }}
          </SkeletonBlock>
        </div>
      </div>

      <div
        class="p-3 md:p-6 flex flex-col gap-4 border-t surface-border"
        v-if="accountIsNotRegular"
      >
        <div class="flex justify-between">
          <span class="text-color-secondary text-sm">Credit that will be used for payment</span>
          <SkeletonBlock
            :isLoaded="isCurrentInvoiceLoaded"
            class="text-color"
          >
            <span class="text-color-secondary text-sm">$</span>
            {{ currentInvoice.creditUsedForPayment }}
          </SkeletonBlock>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-color-secondary text-sm flex items-center gap-3">
            <b class="font-medium text-2xl text-color"> Total </b>
            (Amount Payable)
          </span>
          <SkeletonBlock
            sizeHeight="medium"
            width="6rem"
            :isLoaded="isCurrentInvoiceLoaded"
            class="font-medium flex items-center gap-1"
          >
            <span class="text-sm">$</span>
            <span class="text-2xl">
              {{ currentInvoice.total }}
            </span>
          </SkeletonBlock>
        </div>
      </div>
    </div>
    <div
      class="w-full surface-section sm:w-1/2 border surface-border rounded-md flex flex-col justify-between"
    >
      <div class="p-3 md:p-6 flex flex-col gap-4">
        <div class="flex justify-between">
          <span class="font-medium text-lg text-color">Service Plan</span>
          <PrimeButton
            icon="pi pi-arrow-up-right"
            outlined
            iconPos="right"
            size="small"
            label="Show Other Plans"
            @click="showOtherPlans"
          />
        </div>
        <SkeletonBlock
          sizeHeight="large"
          width="12rem"
          :isLoaded="!!servicePlan"
          class="flex items-center gap-4 mb-2"
        >
          <span class="font-medium text-3xl text-color">{{ servicePlan }} </span>
          <Tag
            v-if="isTrail"
            severity="secondary"
            value="Free Trial"
          />
        </SkeletonBlock>
        <div class="flex justify-between">
          <span class="text-color-secondary text-sm">Plan Start Date</span>
          <SkeletonBlock
            :isLoaded="isYourServicePlanLoaded"
            class="font-medium text-color text-sm"
            elementType="span"
          >
            {{ yourServicePlan.paymentDate || '---' }}
          </SkeletonBlock>
        </div>
        <div
          class="flex justify-between items-center"
          v-if="accountIsNotRegular"
        >
          <span class="text-color-secondary text-sm">Payment Method</span>
          <div class="flex items-center gap-2">
            <SkeletonBlock
              class="font-medium text-color text-sm"
              width="8rem"
              sizeHeight="small"
              :isLoaded="defaultCardStatus.loaded"
              elementType="span"
            >
              <span
                class="flex gap-2 items-center"
                v-if="defaultCardStatus.hasData"
              >
                <cardFlagBlock
                  v-if="paymentMethodBrand"
                  :cardFlag="paymentMethodBrand"
                />
                {{ paymentMethodLabel }}
              </span>
              <span v-else>---</span>
            </SkeletonBlock>
            <PrimeButton
              v-if="defaultCardStatus.hasData"
              outlined
              size="small"
              label="Change"
              @click="openChangePaymentMethod"
            />
          </div>
        </div>

        <div
          class="flex justify-between"
          v-if="accountIsNotRegular"
        >
          <span class="text-color-secondary text-sm">Payment Currency</span>
          <SkeletonBlock
            :isLoaded="isYourServicePlanLoaded"
            class="font-medium text-color text-sm"
            elementType="span"
          >
            {{ yourServicePlan.currency }} (<span class="text-color-secondary text-sm">$</span>)
          </SkeletonBlock>
        </div>

        <div
          class="flex justify-between"
          v-if="accountIsNotRegular"
        >
          <span class="text-color-secondary text-sm">Credit Balance</span>
          <SkeletonBlock
            :isLoaded="isYourServicePlanLoaded"
            class="font-medium text-color text-sm"
            elementType="span"
          >
            <span class="text-color-secondary text-sm">$</span>
            0.00
          </SkeletonBlock>
        </div>
      </div>

      <div
        class="p-3 md:p-6 border-t surface-border flex flex-col gap-4"
        v-if="accountIsNotRegular"
      >
        <p class="text-sm text-color-secondary">
          This invoice includes all consumption up to the last day of the month.
        </p>
      </div>
    </div>
  </div>

  <h2 class="text-lg font-medium line-height-1 my-8">Payment History</h2>

  <div
    v-if="hasContentToList"
    class="max-w-full mt-4"
    data-testid="data-table-container"
  >
    <ListTable
      ref="listTableRef"
      :listService="props.listPaymentHistoryService"
      :columns="loaderPaymentHistoryColumns"
      :actions="actionsRow"
      :enableEditClick="false"
      exportFileName="Payment History"
      :lazy="true"
      :allowedFilters="allowedFilters"
      emptyListMessage="No payment activity found."
      @on-load-data="handleLoadData"
      @on-before-go-to-edit="goToEnvoiceDetails"
    />
  </div>

  <EmptyResultsBlock
    v-else
    title="No payment activity yet."
    description="Start using services and products to view your activity."
    :inTabs="true"
    :documentationService="props.documentPaymentHistoryService"
  >
    <template #default>
      <PrimeButton
        class="max-md:w-full w-fit"
        severity="secondary"
        icon="pi pi-plus"
        label="Payment Method"
        @click="openChangePaymentMethod"
      />
    </template>
  </EmptyResultsBlock>

  <DialogChangePaymentMethod
    v-model:visible="showChangePaymentMethodDialog"
    :getStripeClientService="props.getStripeClientService"
  />
</template>

<script setup>
  import { useRouter } from 'vue-router'
  import SkeletonBlock from '@/templates/skeleton-block'
  import EmptyResultsBlock from '@aziontech/webkit/empty-results-block'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import ListTable from '@/components/list-table/ListTable.vue'
  import PrimeButton from '@aziontech/webkit/button'
  import Tag from '@aziontech/webkit/prime-tag'
  import cardFlagBlock from '@templates/card-flag-block'
  import DialogChangePaymentMethod from '@/views/Billing/Dialog/DialogChangePaymentMethod.vue'
  import { useBillingPaymentMethods } from '@/composables/useBillingPaymentMethods'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'

  import { ref, computed, onMounted } from 'vue'

  const router = useRouter()
  const hasContentToList = ref(true)
  const yourServicePlan = ref({})
  const servicePlan = ref(null)
  const accountStore = useAccountStore()
  const listTableRef = ref(null)

  const { accountData, accountIsNotRegular, showExportBilling, billingExperience } =
    storeToRefs(accountStore)

  const user = accountData

  const props = defineProps({
    listPaymentHistoryService: {
      type: Function,
      required: true
    },
    documentPaymentHistoryService: {
      type: Function,
      required: true
    },
    loadYourServicePlanService: {
      type: Function,
      required: true
    },
    openPlans: {
      type: Function,
      required: true
    },
    loadContractServicePlan: {
      type: Function,
      required: true
    },
    loadCurrentInvoiceService: {
      type: Function,
      required: true
    },
    loadPaymentMethodDefaultService: {
      type: Function
    },
    loadInvoiceDataService: {
      type: Function
    },
    listServiceAndProductsChangesService: {
      type: Function
    },
    getStripeClientService: {
      type: Function
    },
    documentPaymentMethodService: {
      type: Function
    },
    loadInvoiceLastUpdatedService: {
      type: Function
    }
  })

  const currentInvoice = ref({})
  const disabledCurrentInvoice = ref(true)
  const showChangePaymentMethodDialog = ref(false)

  const openChangePaymentMethod = () => {
    showChangePaymentMethodDialog.value = true
  }

  const SUPPORTED_CARD_FLAGS = ['visa', 'mastercard', 'amex', 'discover', 'diners', 'jcb']
  const CARD_BRAND_ALIASES = {
    american_express: 'amex',
    americanexpress: 'amex',
    diners_club: 'diners',
    dinersclub: 'diners'
  }

  const {
    defaultPaymentMethod,
    isLoading: isPaymentMethodLoading,
    refetch: refetchPaymentMethod
  } = useBillingPaymentMethods()

  const paymentMethodBrand = computed(() => {
    const raw = (defaultPaymentMethod.value?.brand || '').toLowerCase()
    if (!raw) return null
    const normalized = CARD_BRAND_ALIASES[raw] ?? raw
    return SUPPORTED_CARD_FLAGS.includes(normalized) ? normalized : null
  })

  const paymentMethodLabel = computed(() => {
    const method = defaultPaymentMethod.value
    if (!method?.last4) return '---'
    const brand = method.brand ? method.brand.charAt(0).toUpperCase() + method.brand.slice(1) : ''
    return [brand, method.last4].filter(Boolean).join(' •••• ')
  })

  const defaultCardStatus = computed(() => ({
    loaded: !isPaymentMethodLoading.value,
    hasData: !!defaultPaymentMethod.value?.last4
  }))

  const allowedFilters = [
    {
      header: 'Invoice Number',
      field: 'invoice_number'
    }
  ]

  const isCurrentInvoiceLoaded = ref(true)
  const isYourServicePlanLoaded = ref(true)

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const loaderCurrentInvoice = async () => {
    isCurrentInvoiceLoaded.value = false
    try {
      currentInvoice.value = await props.loadCurrentInvoiceService()
      disabledCurrentInvoice.value = !currentInvoice.value.redirectId
    } finally {
      isCurrentInvoiceLoaded.value = true
    }
  }

  const goToBillingDetails = () => {
    const params = { billId: currentInvoice.value.billId }
    navigateMethod('billing-invoice-details', params)
  }

  const navigateMethod = (name, params) => {
    router.push({
      name,
      params
    })
  }

  const actionsRow = computed(() => {
    const actions = [
      {
        label: 'Details',
        icon: 'pi pi-file',
        type: 'action',
        disabled: (item) => item.isFallback,
        commandAction: (item) => goToEnvoiceDetails(item)
      }
    ]

    if (showExportBilling.value) {
      actions.push({
        label: 'Download Invoice',
        icon: 'pi pi-download',
        type: 'action',
        disabled: (item) => item.disabled || item.isFallback,
        commandAction: (item) => {
          if (item.invoiceUrl) window.open(item.invoiceUrl, '_blank')
        }
      })
    }

    return actions
  })

  const showOtherPlans = () => {
    props.openPlans()
  }

  const goToEnvoiceDetails = (item) => {
    const billId = item.billId || item.id
    if (billId) {
      const routeParams = { billId }
      navigateMethod('billing-invoice-details', routeParams)
    }
  }

  const getYourServicePlan = async () => {
    isYourServicePlanLoaded.value = false
    try {
      yourServicePlan.value = accountIsNotRegular.value
        ? await props.loadYourServicePlanService(user.value.disclaimer)
        : {}
    } finally {
      isYourServicePlanLoaded.value = true
    }
  }

  const billingExperiencePlanLabels = {
    custom: 'Custom Plan',
    internal: 'Internal/Free Plan'
  }

  const getLoadContractService = async () => {
    const presetLabel = billingExperiencePlanLabels[billingExperience.value]
    if (presetLabel) {
      servicePlan.value = presetLabel
      return
    }
    const { yourServicePlan } = await props.loadContractServicePlan({
      clientId: user.value.client_id
    })
    servicePlan.value = `${yourServicePlan} Plan`
  }

  const getAllInfos = async () => {
    await Promise.all([getLoadContractService(), getYourServicePlan()])
  }

  const isTrail = computed(
    () => user.value.status === 'TRIAL' && billingExperience.value !== 'custom'
  )

  const loaderPaymentHistoryColumns = computed(() => {
    if (accountIsNotRegular.value) {
      return [
        {
          field: 'paymentDate',
          header: 'Payment Date'
        },
        {
          field: 'invoiceNumber',
          header: 'Invoice ID',
          filterPath: 'invoiceNumber.content',
          sortField: 'invoiceNumber.content',
          type: 'component',
          component: (columnData) => {
            return columnBuilder({
              data: columnData,
              columnAppearance: 'text-full-with-clipboard'
            })
          }
        },
        {
          field: 'paymentMethod',
          header: 'Payment Method',
          filterPath: 'paymentMethod.value',
          sortField: 'paymentMethod.value',
          type: 'component',
          component: (columnData) =>
            columnBuilder({ data: columnData, columnAppearance: 'credit-card-column' })
        },
        {
          field: 'amount',
          header: 'Transactions Amount'
        },
        {
          field: 'status',
          header: 'Status',
          type: 'component',
          sortField: 'status.content',
          filterPath: 'status.content',
          component: (columnData) => {
            return columnBuilder({
              data: columnData,
              columnAppearance: 'tag'
            })
          }
        }
      ]
    }

    return [
      {
        field: 'paymentDate',
        header: 'Payment Date'
      },
      {
        field: 'invoiceNumber',
        header: 'Invoice ID',
        filterPath: 'invoiceNumber.content',
        sortField: 'invoiceNumber.content',
        type: 'component',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'text-full-with-clipboard'
          })
        }
      }
    ]
  })

  const reloadList = async () => {
    if (hasContentToList.value) {
      await listTableRef.value?.reload()
      return
    }
    hasContentToList.value = true
  }

  const reloadAll = async () => {
    await Promise.allSettled([
      getAllInfos(),
      loaderCurrentInvoice(),
      reloadList(),
      refetchPaymentMethod()
    ])
  }

  onMounted(async () => {
    getAllInfos()
    await loaderCurrentInvoice()
  })

  defineExpose({
    reloadList,
    reloadAll
  })
</script>
