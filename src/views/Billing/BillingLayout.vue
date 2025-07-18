<template>
  <router-view v-slot="{ Component }">
    <component
      ref="componentRef"
      :is="Component"
      v-bind="props"
      :cardDefault="cardDefault"
      @loadCard="loadCardDefault"
      @openDrawerAddCredit="openDrawerCredit"
      @openDrawerAddPaymentMethod="openDrawerPaymentMethod"
    >
      <template #notification="slotProp">
        <NotificationPayment
          ref="notificationPaymentRef"
          :loadCurrentInvoice="props.loadCurrentInvoiceService"
          v-bind="propsNotification(slotProp)"
          @clickAddCredit="openDrawerCredit"
          @clickAddPaymentMethod="openDrawerPaymentMethod"
          @clickLink="slotProp.redirectLink"
        />
      </template>
    </component>
  </router-view>

  <DrawerAddCredit
    ref="drawerAddCreditRef"
    v-if="cardDefault.cardData"
    :cardDefault="cardDefault"
    :createService="paymentService.addCredit"
    @onSuccess="successAddCredit"
  />
  <DrawerPaymentMethod
    ref="drawerPaymentMethodRef"
    :getStripeClientService="props.getStripeClientService"
    @onSuccess="successAddPaymentMethod"
  />
</template>

<script setup>
  import DrawerAddCredit from '@/views/Billing/Drawer/DrawerAddCredit.vue'
  import DrawerPaymentMethod from '@/views/Billing/Drawer/DrawerPaymentMethod.vue'
  import { paymentService } from '@/services/v2'
  import { ref, onMounted } from 'vue'
  import NotificationPayment from '@/views/Billing/components/notification-payment'

  const props = defineProps({
    loadPaymentMethodDefaultService: { type: Function, required: true },
    getStripeClientService: { type: Function, required: true },
    loadCurrentInvoiceService: { type: Function, required: true },
    loadInvoiceDataService: { type: Function, required: true },
    listServiceAndProductsChangesService: { type: Function, required: true },
    clipboardWrite: { type: Function, required: true },
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
  const drawerAddCreditRef = ref(null)
  const drawerPaymentMethodRef = ref(null)

  const cardDefault = ref({
    loader: false
  })

  const propsNotification = ({ buttonCredit = {}, linkText = {}, buttonPaymentMethod = {} }) => ({
    buttonCredit: {
      hidden: !cardDefault.value.cardData,
      ...buttonCredit
    },
    linkText: {
      ...linkText
    },
    buttonPaymentMethod: {
      ...buttonPaymentMethod
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

  const openDrawerCredit = () => {
    drawerAddCreditRef.value?.openDrawer()
  }

  const openDrawerPaymentMethod = () => {
    drawerPaymentMethodRef.value?.openDrawer()
  }

  const successAddCredit = () => {
    componentRef.value?.callBackDrawer()
    notificationPaymentRef.value?.reload()
  }

  const successAddPaymentMethod = () => {
    componentRef.value?.callBackDrawer()
    loadCardDefault()
    notificationPaymentRef.value?.reload()
  }

  onMounted(() => {
    loadCardDefault()
  })
</script>
