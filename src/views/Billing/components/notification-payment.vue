<template>
  <SkeletonBlock
    v-if="!showNotification"
    class="w-full h-5rem"
  />
  <MessageNotification
    v-else
    :title="notificationPayment.title"
    :typeMessage="notificationPayment.type"
    :buttons="actionsButtons"
  >
    <template #description>
      {{ notificationPayment.description }}
      <PrimeButton
        label="payment methods."
        link
        class="p-0 text-sm"
        :disabled="props.disabledLinkPaymentMethod"
        @click="redirectPayment"
      />
    </template>
  </MessageNotification>
</template>
<script setup>
  import MessageNotification from '@/templates/message-notification'
  import { useAccountStore } from '@/stores/account'
  import PrimeButton from 'primevue/button'
  import { computed, ref, onMounted } from 'vue'
  import { billingGqlService } from '@/services/v2'
  import { formatUnitValue } from '@/helpers'
  import SkeletonBlock from '@/templates/skeleton-block'

  defineOptions({ name: 'notification-payment' })

  const emit = defineEmits(['clickAddCredit', 'clickAddPaymentMethod', 'clickLink'])

  const { accountIsNotRegular, accountData } = useAccountStore()
  const { status } = accountData

  const showNotification = ref(false)

  const props = defineProps({
    disabledCredit: {
      type: Boolean,
      default: false
    },
    disabledPaymentMethod: {
      type: Boolean,
      default: false
    },
    disabledLinkPaymentMethod: {
      type: Boolean,
      default: false
    },
    loadCurrentInvoice: {
      type: Function,
      required: true
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
      onClick: () => emit('clickAddCredit'),
      outlined: true,
      disabled: props.disabledCredit
    },
    {
      label: 'Payment Method',
      icon: 'pi pi-plus',
      onClick: () => emit('clickAddPaymentMethod'),
      severity: 'secondary',
      disabled: props.disabledPaymentMethod
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

  const loadText = async () => {
    try {
      if (!accountIsNotRegular) return

      if (status === 'TRIAL' || status === 'ONLINE') {
        const { credit, days, formatCredit } = await billingGqlService.getCreditAndExpirationDate()
        if (!(credit > 0 && days > 0)) return
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

      showNotification.value = true
    } catch {
      showNotification.value = false
    }
  }

  onMounted(() => {
    loadText()
  })
</script>
