<template>
  <router-view v-slot="routeSlot">
    <component
      v-if="routeSlot?.Component"
      ref="componentRef"
      :is="routeSlot.Component"
      v-bind="props"
      :cardDefault="cardDefault"
      @loadCard="loadCardDefault"
      @openDrawerAddCredit="openDrawerCredit"
    >
      <template #notification="slotProp">
        <NotificationPayment
          ref="notificationPaymentRef"
          v-bind="propsNotification(slotProp)"
          @clickLink="slotProp.redirectLink"
          @onSuccessCredit="successDrawer"
        />
      </template>
    </component>
  </router-view>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import NotificationPayment from '@/views/Billing/components/notification-payment'
  import { loadContractData } from '@/helpers/account-data'

  const props = defineProps({
    loadPaymentMethodDefaultService: { type: Function, required: true },
    getStripeClientService: { type: Function, required: true },
    loadCurrentInvoiceService: { type: Function, required: true },
    loadInvoiceDataService: { type: Function, required: true },
    listServiceAndProductsChangesService: { type: Function, required: true },
    documentPaymentMethodService: { type: Function, required: true },
    listPaymentHistoryService: { type: Function, required: true },
    documentPaymentHistoryService: { type: Function, required: true },
    loadYourServicePlanService: { type: Function, required: true },
    openPlans: { type: Function, required: true },
    loadContractServicePlan: { type: Function, required: true },
    loadInvoiceLastUpdatedService: { type: Function, required: true }
  })

  const componentRef = ref(null)
  const notificationPaymentRef = ref(null)

  const cardDefault = ref({
    loader: false
  })

  const propsNotification = ({ buttonCredit = {}, linkText = {}, buttonPaymentMethod = {} }) => ({
    loadCurrentInvoice: props.loadCurrentInvoiceService,
    getStripeClientService: props.getStripeClientService,
    cardDefault: cardDefault.value,
    buttonCredit: {
      ...buttonCredit
    },
    linkText: {
      ...linkText
    },
    buttonPaymentMethod: {
      ...buttonPaymentMethod,
      hidden: true
    }
  })

  const loadCardDefault = async () => {
    cardDefault.value.loader = false
    try {
      cardDefault.value = await props.loadPaymentMethodDefaultService()
    } finally {
      cardDefault.value = {
        ...cardDefault.value,
        loader: true
      }
    }
  }

  const successDrawer = async () => {
    componentRef.value?.callBackDrawer()
    loadCardDefault()
  }

  const openDrawerCredit = async () => {
    notificationPaymentRef.value?.openDrawerCredit()
  }

  onMounted(() => {
    loadContractData()
    loadCardDefault()
  })
</script>
