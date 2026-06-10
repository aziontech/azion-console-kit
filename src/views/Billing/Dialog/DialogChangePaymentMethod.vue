<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    :closable="!isSubmitting"
    :draggable="false"
    :style="{ width: 'min(90vw, 576px)' }"
    :pt="{
      root: { class: 'overflow-hidden rounded-md border border-[var(--border-default)]' },
      header: {
        class: 'h-14 border-b border-[var(--border-default)] bg-[var(--surface-50)] px-8'
      },
      title: { class: 'text-base font-semibold leading-[21px] text-default' },
      content: { class: 'bg-[var(--surface-100)] p-0' },
      footer: {
        class: 'h-14 border-t border-[var(--border-default)] bg-[var(--surface-50)] px-8 m-0'
      }
    }"
    header="Payment Method"
  >
    <div class="flex flex-col gap-3.5 px-8 py-5">
      <PaymentMethodSetupBlock
        ref="paymentSetupRef"
        :stripeClientService="getStripeClientService"
        :clientSecret="setupIntentClientSecret"
        :showHeader="false"
        @readiness-change="handlePaymentReadinessChange"
      />

      <InlineMessage
        v-if="error"
        severity="error"
        class="text-xs break-all"
      >
        {{ error }}
      </InlineMessage>
    </div>

    <template #footer>
      <div class="flex h-14 items-center justify-end gap-2">
        <ActionButton
          kind="outlined"
          size="medium"
          label="Cancel"
          :disabled="isSubmitting"
          @click="close"
        />
        <ActionButton
          kind="primary"
          size="medium"
          label="Update"
          :loading="isSubmitting"
          :disabled="isConfirmDisabled"
          @click="handleSubmit"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import { useQueryClient } from '@tanstack/vue-query'
  import Dialog from '@aziontech/webkit/dialog'
  import ActionButton from '@aziontech/webkit/actions/button'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import PaymentMethodSetupBlock from '@/templates/checkout-block/payment-method-setup-block.vue'
  import { useUpdateDefaultPaymentMethod } from '@/composables/useUpdateDefaultPaymentMethod'
  import { queryKeys } from '@/services/v2/base/query/queryKeys'
  import { useToast } from '@aziontech/webkit/use-toast'

  defineOptions({ name: 'dialog-change-payment-method' })

  const props = defineProps({
    visible: { type: Boolean, default: false },
    getStripeClientService: { type: Function, required: true }
  })

  const emit = defineEmits(['update:visible', 'updated'])

  const toast = useToast()
  const queryClient = useQueryClient()
  const { createSetupIntent, setDefault: setDefaultPaymentMethod } = useUpdateDefaultPaymentMethod()

  const awaitDefaultPaymentMethod = async (
    paymentMethodId,
    { maxAttempts = 6, delayMs = 500 } = {}
  ) => {
    const key = queryKeys.serviceOrders.billingPaymentMethods()
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      await queryClient.refetchQueries({ queryKey: key })
      const data = queryClient.getQueryData(key)
      if (data?.defaultPaymentMethod?.id === paymentMethodId) return
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  const paymentSetupRef = ref(null)
  const isSubmitting = ref(false)
  const isPaymentFormReady = ref(false)
  const setupIntentClientSecret = ref('')
  const error = ref('')

  const isVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const isConfirmDisabled = computed(
    () => isSubmitting.value || !setupIntentClientSecret.value || !isPaymentFormReady.value
  )

  const handlePaymentReadinessChange = (isReady) => {
    isPaymentFormReady.value = Boolean(isReady)
  }

  const close = () => {
    if (isSubmitting.value) return
    isVisible.value = false
  }

  const initSetupIntent = async () => {
    setupIntentClientSecret.value = ''
    isPaymentFormReady.value = false
    error.value = ''
    try {
      const { clientSecret } = await createSetupIntent()
      if (!clientSecret) {
        throw new Error('Setup intent client secret missing in response.')
      }
      setupIntentClientSecret.value = clientSecret
    } catch (err) {
      error.value = err?.message || 'Unable to initialize payment method update.'
    }
  }

  watch(
    () => props.visible,
    (visible) => {
      if (visible) {
        initSetupIntent()
        return
      }
      setupIntentClientSecret.value = ''
      isPaymentFormReady.value = false
      isSubmitting.value = false
      error.value = ''
    }
  )

  const handleSubmit = async () => {
    if (isSubmitting.value) return
    isSubmitting.value = true
    error.value = ''
    try {
      const newPaymentMethodId = await paymentSetupRef.value?.confirmSetup?.()
      if (!newPaymentMethodId) {
        throw new Error('Unable to confirm new payment method.')
      }
      await setDefaultPaymentMethod(newPaymentMethodId)
      await awaitDefaultPaymentMethod(newPaymentMethodId)
      toast.add({
        severity: 'success',
        summary: 'Payment method updated',
        detail: 'Your default payment method has been updated successfully.',
        life: 6000,
        closable: true
      })
      emit('updated')
      isVisible.value = false
    } catch (err) {
      error.value =
        (Array.isArray(err?.message) ? err.message[0] : err?.message) ||
        'Unable to update payment method.'
    } finally {
      isSubmitting.value = false
    }
  }
</script>
