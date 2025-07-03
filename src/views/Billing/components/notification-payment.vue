<template>
  <MessageNotification
    v-if="notificationPayment"
    :title="notificationPayment.title"
    :typeMessage="notificationPayment.type"
    :icon="notificationPayment.icon"
    :buttons="actionsButtons"
  >
    <template #description>
      {{ displayText }}
      <PrimeButton
        label="payment methods."
        link
        class="p-0 text-sm"
        :disabled="props.disabledLinkPaymentMethod"
        @click="emit('clickLinkPaymentMethod')"
      />
    </template>
  </MessageNotification>
</template>
<script setup>
  import MessageNotification from '@/templates/message-notification'
  import { useAccountStore } from '@/stores/account'
  import PrimeButton from 'primevue/button'
  import { computed, ref, onMounted } from 'vue'

  defineOptions({
    name: 'notification-payment'
  })

  const emit = defineEmits(['clickAddCredit', 'clickAddPaymentMethod', 'clickLinkPaymentMethod'])

  const { status } = useAccountStore().accountData

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

  const displayText = ref('')

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

  const loadText = async () => {
    if (status !== 'TRIAL') {
      const total = await props
        .loadCurrentInvoice()
        .then((invoice) => invoice?.total || '0')
        .catch(() => '0')

      displayText.value = notificationPayment.value.description(total)
    } else {
      displayText.value = notificationPayment.value.description({
        total: 20,
        days: 30
      })
    }
  }

  const mapStatusPayment = {
    BLOCKED: {
      title: 'Your account is blocked',
      type: 'error',
      description: (total = 0) => {
        const displayTotal = total !== '--' ? `${total}` : 'pending'
        return `Your account is blocked due to ${displayTotal} in pending payments. To unblock your account, update or verify your`
      }
    },
    DEFAULTING: {
      title: 'Pending Payments',
      type: 'warning',
      description: (total = 0) => {
        const displayTotal = total || 'pending'
        return `You have $${displayTotal} in pending payments. To use Azion with no service interruptions update or verify your`
      }
    },
    TRIAL: {
      title: 'Your free trial credit balance is running',
      type: 'info',
      description: ({ total = 20, days = 30 }) => {
        return `You have $${total} to use in ${days} days. To use Azion with no service interruptions at the end of your trial, add a`
      }
    }
  }

  const notificationPayment = computed(() => mapStatusPayment[status])

  onMounted(() => {
    loadText()
  })
</script>
