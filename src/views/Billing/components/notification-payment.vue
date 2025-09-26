<template>
  <DrawerAddCredit
    ref="drawerAddCreditRef"
    v-if="props.cardDefault.cardData"
    :cardDefault="props.cardDefault"
    :createService="paymentService.addCredit"
    @onSuccess="successCredit"
  />
  <DrawerPaymentMethod
    ref="drawerPaymentMethodRef"
    :getStripeClientService="props.getStripeClientService"
    @onSuccess="successPaymentMethod"
  />

  <SkeletonBlock
    v-if="!showNotification && loadingNotification"
    class="w-full h-5rem"
  />
  <MessageNotification
    v-else-if="showNotification"
    :title="notificationPayment.title"
    :typeMessage="notificationPayment.type"
    :buttons="actionsButtons"
  >
    <template #description>
      {{ notificationPayment.description }}
      <PrimeButton
        v-if="!props.linkText.hidden"
        :label="labelLink"
        link
        class="p-0 text-sm"
        :disabled="props.linkText.disabled"
        @click="redirectPayment"
      />
      <span v-else>{{ labelLink }}</span>
    </template>
  </MessageNotification>
</template>
<script setup>
  import DrawerAddCredit from '@/views/Billing/Drawer/DrawerAddCredit.vue'
  import DrawerPaymentMethod from '@/views/Billing/Drawer/DrawerPaymentMethod.vue'
  import { paymentService } from '@/services/v2/payment/payment-service'
  import MessageNotification from '@/templates/message-notification'
  import { useAccountStore } from '@/stores/account'
  import PrimeButton from 'primevue/button'
  import { computed, ref, onMounted } from 'vue'
  import { formatUnitValue } from '@/helpers'
  import SkeletonBlock from '@/templates/skeleton-block'
  import { loadUserAndAccountInfo } from '@/helpers/account-data'
  import { useToast } from 'primevue/usetoast'

  defineOptions({ name: 'notification-payment' })

  const emit = defineEmits([
    'clickAddCredit',
    'clickAddPaymentMethod',
    'clickLink',
    'onSuccessCredit',
    'onSuccessPaymentMethod'
  ])

  const toast = useToast()
  const showNotification = ref(false)
  const loadingNotification = ref(false)
  const drawerAddCreditRef = ref(null)
  const drawerPaymentMethodRef = ref(null)
  const labelLink = ref('payment methods.')

  const props = defineProps({
    getStripeClientService: {
      type: Function,
      required: true
    },
    cardDefault: {
      type: Object,
      default: () => ({
        cardData: null
      })
    },
    buttonCredit: {
      type: Object,
      default: () => ({
        disabled: false
      })
    },
    linkText: {
      type: Object,
      default: () => ({
        disabled: false
      })
    },
    buttonPaymentMethod: {
      type: Object,
      default: () => ({
        disabled: false
      })
    },
    loadCurrentInvoice: {
      type: Function
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
    documentPaymentMethodService: {
      type: Function
    },
    loadInvoiceLastUpdatedService: {
      type: Function
    }
  })

  const redirectPayment = async () => {
    emit('clickLink')
  }

  const notificationPayment = ref({})

  const actionsButtons = computed(() => [
    {
      label: 'Credit',
      icon: 'pi pi-plus',
      onClick: () => {
        openDrawerCredit()
        emit('clickAddCredit')
      },
      hidden: !props.cardDefault.cardData,
      outlined: true,
      ...props.buttonCredit
    },
    {
      label: 'Payment Method',
      icon: 'pi pi-plus',
      onClick: () => {
        openDrawerPaymentMethod()
        emit('clickAddPaymentMethod')
      },
      severity: 'secondary',
      ...props.buttonPaymentMethod
    }
  ])

  const totalPending = async () => {
    return await props
      .loadCurrentInvoice()
      .then((invoice) => invoice?.total || '0')
      .catch(() => '0')
  }

  const NOTIFICATION_CONFIGS = {
    TRIAL: {
      title: 'Your free trial credit balance is running',
      type: 'info',
      getDescription: (credit, days) =>
        `You have $${credit} to use in ${days} days. To use Azion with no service interruptions at the end of your trial, add a`
    },
    BLOCKED: {
      title: 'Your account is blocked',
      type: 'error',
      getDescription: (total) =>
        `Your account is blocked due to $${
          total !== '--' ? formatUnitValue(total) : 'pending'
        } in pending payments. To unblock your account, update or verify your`
    },
    DEFAULTING: {
      title: 'Pending Payments',
      type: 'warning',
      getDescription: (total) =>
        `You have $${
          total !== '--' ? formatUnitValue(total) : 'pending'
        } in pending payments. To use Azion with no service interruptions update or verify your`
    }
  }

  const loadText = async ({ accountIsNotRegular, accountData }) => {
    const { status } = accountData
    loadingNotification.value = true
    showNotification.value = false

    try {
      if (!accountIsNotRegular) {
        loadingNotification.value = false
        return
      }

      if (status === 'TRIAL' || status === 'ONLINE') {
        const { credit, days, formatCredit } = accountData
        if (!(credit > 0 && days > 0)) {
          loadingNotification.value = false
          showNotification.value = false
          return
        }
        notificationPayment.value = {
          ...NOTIFICATION_CONFIGS.TRIAL,
          description: NOTIFICATION_CONFIGS.TRIAL.getDescription(formatCredit, days)
        }
      } else if (status === 'BLOCKED' || status === 'DEFAULTING') {
        const total = await totalPending()
        notificationPayment.value = {
          ...NOTIFICATION_CONFIGS[status],
          description: NOTIFICATION_CONFIGS[status].getDescription(total)
        }
      }
      loadingNotification.value = false
      showNotification.value = true
    } catch {
      showNotification.value = false
      loadingNotification.value = false
    }
  }

  const reload = async () => {
    await updateAccountStatus()
    const account = useAccountStore()
    await loadText(account)
  }

  const updateAccountStatus = async () => {
    try {
      await loadUserAndAccountInfo()
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Error',
        detail:
          'An error occurred while updating account status. Please refresh the page to see the latest changes.'
      })
    }
  }

  const successPaymentMethod = () => {
    reload()
    emit('onSuccessPaymentMethod')
  }

  const successCredit = () => {
    reload()
    emit('onSuccessCredit')
  }

  const openDrawerCredit = async () => {
    drawerAddCreditRef.value?.openDrawer()
  }

  const openDrawerPaymentMethod = async () => {
    drawerPaymentMethodRef.value?.openDrawer()
  }

  onMounted(() => {
    const account = useAccountStore()
    loadText(account)
  })

  defineExpose({
    reload,
    openDrawerCredit,
    openDrawerPaymentMethod
  })
</script>
