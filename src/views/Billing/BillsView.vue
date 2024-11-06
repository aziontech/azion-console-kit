<template>
  <div class="w-full flex flex-col-reverse sm:flex-row gap-6 mt-6">
    <div
      class="w-full sm:w-1/2 flex flex-col justify-between h-[25.00rem] border surface-border rounded-md"
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
            :disabled="currentInvoice.billId"
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
          <span class="text-color-secondary text-sm">Credit Used for Payment</span>
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
      class="w-full sm:w-1/2 h-[25.00rem] border surface-border rounded-md flex flex-col justify-between"
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
            {{ yourServicePlan.paymentDate }}
          </SkeletonBlock>
        </div>
        <div
          class="flex justify-between"
          v-if="accountIsNotRegular"
        >
          <span class="text-color-secondary text-sm">Payment Method</span>
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
              <cardFlagBlock :cardFlag="cardDefault.cardData.cardBrand" />
              {{ cardDefault.cardData.cardNumber }}
            </span>
            <span v-else>---</span>
          </SkeletonBlock>
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
            {{ yourServicePlan.creditBalance }}
          </SkeletonBlock>
        </div>
      </div>

      <div
        class="p-3 md:p-6 border-t surface-border flex flex-col gap-4"
        v-if="accountIsNotRegular"
      >
        <p class="text-sm text-color-secondary">
          This invoice includes all consumption up to the last day of the month. Change
          <span
            @click="goToPayment"
            class="text-[var(--text-color-link)] cursor-pointer"
          >
            payment method.
          </span>
        </p>
      </div>
    </div>
  </div>

  <NotificationPayment
    v-if="user.disclaimer"
    :clickAddCredit="drawersMethods.openDrawerAddCredit"
    :clickAddPaymentMethod="drawersMethods.openDrawerPaymentMethod"
    :clickLinkPaymentMethod="goToPayment"
    :disabledBtnAddCredit="!defaultCardStatus.hasData"
  />

  <h2 class="text-lg font-medium line-height-1 my-8">Payment History</h2>

  <ListTableBlock
    v-if="hasContentToList"
    ref="listPaymentHistoryRef"
    isTabs
    :enableEditClick="false"
    :columns="loaderPaymentHistoryColumns"
    :listService="props.listPaymentHistoryService"
    @on-load-data="handleLoadData"
    @on-before-go-to-edit="goToEnvoiceDetails"
    :actions="actionsRow"
    emptyListMessage="No payment activity found."
  />
  <EmptyResultsBlock
    v-else
    title="No payment activity has been recorded"
    description="Add a payment method and start using services and products to view your activity."
    :inTabs="true"
    createButtonLabel="Add Credit"
    :documentationService="props.documentPaymentHistoryService"
  >
    <template #default>
      <PrimeButton
        class="max-md:w-full w-fit"
        label="Credit"
        icon="pi pi-plus"
        :disabled="!defaultCardStatus.hasData"
        @click="drawersMethods.openDrawerAddCredit"
        outlined
      >
      </PrimeButton>
      <PrimeButton
        class="max-md:w-full w-fit"
        severity="secondary"
        icon="pi pi-plus"
        label="Payment Method"
        @click="drawersMethods.openDrawerPaymentMethod"
      />
    </template>
  </EmptyResultsBlock>
</template>

<script setup>
  import { useRouter } from 'vue-router'
  import SkeletonBlock from '@/templates/skeleton-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import ListTableBlock from '@templates/list-table-block'
  import NotificationPayment from './components/notification-payment'
  import PrimeButton from 'primevue/button'
  import Tag from 'primevue/tag'
  import cardFlagBlock from '@templates/card-flag-block'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'

  import { ref, computed, onMounted, inject } from 'vue'

  const router = useRouter()
  const hasContentToList = ref(true)
  const yourServicePlan = ref({})
  const servicePlan = ref(null)
  const emit = defineEmits(['changeTab'])
  const accountStore = useAccountStore()

  const { accountData, accountIsNotRegular } = storeToRefs(accountStore)

  const user = accountData
  const drawersMethods = inject('drawersMethods')

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
    clipboardWrite: {
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
    cardDefault: {
      type: Object
    }
  })

  const currentInvoice = ref({})

  const defaultCardStatus = computed(() => ({
    loaded: props.cardDefault.loader,
    hasData: !!props.cardDefault.cardData
  }))

  const isCurrentInvoiceLoaded = ref(true)
  const isYourServicePlanLoaded = ref(true)
  const listPaymentHistoryRef = ref('')

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const loaderCurrentInvoice = async () => {
    isCurrentInvoiceLoaded.value = false
    try {
      currentInvoice.value = await props.loadCurrentInvoiceService()
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

  const actionsRow = ref([
    {
      label: 'Set as default',
      icon: 'pi pi-download',
      type: 'action',
      disabled: (item) => !item.invoiceUrl,
      commandAction: async (item) => {
        if (item.invoiceUrl) window.open(item.invoiceUrl, '_blank')
      }
    }
  ])

  const showOtherPlans = () => {
    props.openPlans()
  }

  const goToEnvoiceDetails = (item) => {
    if (item.invoiceNumber.content) {
      const invoiceNumber = item.invoiceNumber.content
      const routeParams = { billId: invoiceNumber }
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

  const getLoadContractService = async () => {
    const { yourServicePlan } = await props.loadContractServicePlan({
      clientId: user.value.client_id
    })
    servicePlan.value = `${yourServicePlan} Plan`
  }

  const goToPayment = () => {
    emit('changeTab', 1)
  }

  const getAllInfos = async () => {
    await Promise.all([getLoadContractService(), getYourServicePlan()])
  }

  const isTrail = computed(() => user.value.status === 'TRIAL')

  const reloadList = () => {
    if (hasContentToList.value) {
      listPaymentHistoryRef.value.reload()
      return
    }
    hasContentToList.value = true
  }

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
              columnAppearance: 'text-full-with-clipboard',
              dependencies: {
                copyContentService: props.clipboardWrite
              }
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
          header: 'Amount'
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
    } else {
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
              columnAppearance: 'text-full-with-clipboard',
              dependencies: {
                copyContentService: props.clipboardWrite
              }
            })
          }
        }
      ]
    }
  })

  onMounted(async () => {
    getAllInfos()
    await loaderCurrentInvoice()
  })

  defineExpose({
    reloadList
  })
</script>
