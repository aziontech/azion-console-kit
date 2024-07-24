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
            label="Details"
            @click="goToBillingDetails()"
          />
        </div>
        <div class="flex justify-between mt-4">
          <span class="text-color-secondary text-sm">Billing Period</span>
          <span class="font-medium text-color text-sm">{{ currentInvoice.billingPeriod }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-color-secondary text-sm">Product Charges</span>
          <span class="text-color text-sm"> {{ currentInvoice.productChanges }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-color-secondary text-sm">Professional Services Plan Charges</span>
          <span class="text-color text-sm"> {{ currentInvoice.servicePlan }}</span>
        </div>
      </div>

      <div class="p-3 md:p-6 flex flex-col gap-4 border-t surface-border">
        <div class="flex justify-between">
          <span class="text-color-secondary text-sm">Credit Used for Payment</span>
          <span class="text-color">
            <span class="text-color-secondary text-sm">$</span>
            {{ currentInvoice.creditUsedForPayment }}</span
          >
        </div>
        <div class="flex justify-between">
          <span class="text-color-secondary text-sm flex items-center gap-3">
            <b class="font-medium text-2xl text-color"> Total </b>
            (Amount Payable)
          </span>
          <span class="font-medium text-2xl">
            <span class="text-color-secondary text-sm font-medium">$</span>
            {{ currentInvoice.total }}</span
          >
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
            label="Show Other Plans"
            @click="showOtherPlans"
          />
        </div>
        <div class="flex items-center gap-4 mb-2">
          <span class="font-medium text-3xl text-color">{{ servicePlan }} Plan</span>
          <Tag
            v-if="isTrail"
            severity="secondary"
            value="Free Trial"
          />
        </div>
        <div class="flex justify-between">
          <span class="text-color-secondary text-sm">Plan Start Date</span>
          <span class="font-medium text-color text-sm"> {{ yourServicePlan.paymentDate }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-color-secondary text-sm">Payment Method</span>
          <span class="font-medium text-color text-sm">
            <span
              v-if="props.cardDefault"
              class="flex gap-2 items-center"
            >
              <cardFlagBlock :cardFlag="cardDefault.cardData.cardBrand" />
              {{ cardDefault.cardData.cardNumber }}
            </span>
            <span v-else>---</span>
          </span>
        </div>
        <div class="flex justify-between">
          <span class="text-color-secondary text-sm">Payment Currency</span>
          <span class="font-medium text-color text-sm"
            >USD (<span class="text-color-secondary text-sm">$</span>)</span
          >
        </div>
        <div class="flex justify-between">
          <span class="text-color-secondary text-sm">Credit Balance</span>
          <span>
            <span class="text-color-secondary text-sm">$</span>
            {{ yourServicePlan.creditBalance }}
          </span>
        </div>
      </div>

      <div class="p-3 md:p-6 border-t surface-border flex flex-col gap-4">
        <p class="text-sm text-color-secondary">
          This invoice includes all consumption up to the last day of the month. Change
          <span
            @click="goToPayment"
            class="text-[var(--text-color-link)] cursor-pointer"
            >payment method.</span
          >
        </p>
      </div>
    </div>
  </div>

  <NotificationPayment
    v-if="user.disclaimer"
    :clickAddCredit="drawersMethods.openDrawerAddCredit"
    :clickAddPaymentMethod="drawersMethods.openDrawerPaymentMethod"
    :clickLinkPaymentMethod="goToPayment"
    :showBtnAddCredit="isCardDefault"
  />

  <h2 class="text-lg font-medium line-height-1 my-8">Payment History</h2>

  <ListTableBlock
    v-if="hasContentToList"
    ref="listPaymentHistoryRef"
    isTabs
    :enableEditClick="false"
    :columns="paymentsColumns"
    :listService="props.listPaymentHistoryService"
    @on-load-data="handleLoadData"
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
        label="Add Credit"
        icon="pi pi-plus"
        :disabled="!isCardDefault"
        @click="drawersMethods.openDrawerAddCredit"
        outlined
      >
      </PrimeButton>
      <PrimeButton
        class="max-md:w-full w-fit"
        severity="secondary"
        icon="pi pi-plus"
        label="Add Payment Method"
        @click="goToPayment"
      />
    </template>
  </EmptyResultsBlock>
</template>

<script setup>
  import { useRouter } from 'vue-router'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import ListTableBlock from '@templates/list-table-block'
  import NotificationPayment from './Components/Notification-payment'
  import PrimeButton from 'primevue/button'
  import Tag from 'primevue/tag'
  import cardFlagBlock from '@templates/card-flag-block'
  import { useAccountStore } from '@/stores/account'

  import { ref, computed, onMounted, inject } from 'vue'

  const router = useRouter()
  const hasContentToList = ref(true)
  const yourServicePlan = ref({})
  const servicePlan = ref('')
  const emit = defineEmits(['changeTab'])
  const user = useAccountStore().accountData

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
  const isCardDefault = computed(() => !!props.cardDefault)

  const currentInvoice = ref({})
  const listPaymentHistoryRef = ref('')

  const paymentsColumns = ref([
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
  ])

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const loaderCurrentInvoice = async () => {
    currentInvoice.value = await props.loadCurrentInvoiceService()
  }

  const goToBillingDetails = () => {
    router.push({
      name: 'billing-invoice-details',
      params: { billId: currentInvoice.value.billId }
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

  const getYourServicePlan = async () => {
    yourServicePlan.value = await props.loadYourServicePlanService(user.disclaimer)
  }

  const getLoadContractService = async () => {
    const { yourServicePlan } = await props.loadContractServicePlan({
      clientId: user.client_id
    })
    servicePlan.value = yourServicePlan
  }

  const goToPayment = () => {
    emit('changeTab', 1)
  }

  const getAllInfos = async () => {
    await Promise.all([getLoadContractService(), getYourServicePlan()])
  }

  const isTrail = computed(() => user.status === 'TRIAL')

  const reloadList = () => {
    if (hasContentToList.value) {
      listPaymentHistoryRef.value.reload()
      return
    }
    hasContentToList.value = true
  }

  onMounted(async () => {
    getAllInfos()
    await loaderCurrentInvoice()
  })

  defineExpose({
    reloadList
  })
</script>
