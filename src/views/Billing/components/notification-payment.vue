<template>
  <DrawerAddCredit
    ref="drawerAddCreditRef"
    v-if="props.cardDefault.cardData"
    :cardDefault="props.cardDefault"
    :createService="paymentService.addCredit"
    @onSuccess="successCredit"
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
    class="mb-4"
  >
    <template #description>
      {{ notificationPayment.description }}
      <ActionButton
        v-if="!props.linkText.hidden"
        :label="labelLink"
        kind="text"
        size="small"
        :disabled="props.linkText.disabled"
        @click="redirectPayment"
      />
      <span v-else>{{ labelLink }}</span>
    </template>
  </MessageNotification>
</template>
<script setup>
  import DrawerAddCredit from '@/views/Billing/Drawer/DrawerAddCredit.vue'
  import { paymentService } from '@/services/v2/payment/payment-service'
  import MessageNotification from '@/templates/message-notification'
  import { useAccountStore } from '@/stores/account'
  import ActionButton from '@aziontech/webkit/actions/button'
  import { computed, ref, onMounted } from 'vue'
  import { formatUnitValue } from '@/helpers'
  import SkeletonBlock from '@/templates/skeleton-block'
  import { loadUserAndAccountInfo } from '@/helpers/account-data'
  import { useToast } from '@aziontech/webkit/use-toast'

  defineOptions({ name: 'notification-payment' })

  const emit = defineEmits(['clickAddCredit', 'clickLink', 'onSuccessCredit'])

  const toast = useToast()
  const showNotification = ref(false)
  const loadingNotification = ref(false)
  const drawerAddCreditRef = ref(null)
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
    }
  ])

  const totalPending = async () => {
    return await props
      .loadCurrentInvoice()
      .then((invoice) => invoice?.total || '0')
      .catch(() => '0')
  }

  const NOTIFICATION_CONFIGS = {
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

      if (status === 'BLOCKED' || status === 'DEFAULTING') {
        const total = await totalPending()
        notificationPayment.value = {
          ...NOTIFICATION_CONFIGS[status],
          description: NOTIFICATION_CONFIGS[status].getDescription(total)
        }
        loadingNotification.value = false
        showNotification.value = true
        return
      }

      loadingNotification.value = false
      showNotification.value = false
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

  const successCredit = () => {
    reload()
    emit('onSuccessCredit')
  }

  const openDrawerCredit = async () => {
    drawerAddCreditRef.value?.openDrawer()
  }

  onMounted(() => {
    const account = useAccountStore()
    loadText(account)
  })

  defineExpose({
    reload,
    openDrawerCredit
  })
</script>
