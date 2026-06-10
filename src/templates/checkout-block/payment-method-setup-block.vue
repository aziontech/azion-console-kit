<template>
  <div class="border border-[var(--border-muted)] border-solid rounded-md bg-surface">
    <div
      v-if="showHeader"
      class="flex items-center justify-between px-6 py-3 border-b border-[var(--border-muted)]"
    >
      <span class="text-base leading-none text-default">Payment Method</span>
      <ActionButton
        kind="text"
        size="small"
        label="Cancel"
        @click="$emit('cancel')"
      />
    </div>

    <div class="flex flex-col gap-8 p-6">
      <div
        class="flex flex-col gap-2 w-full"
        :class="{ 'stripe-input-invalid': !!error }"
      >
        <div class="relative">
          <div
            v-if="!paymentElementReady"
            class="flex flex-col gap-4"
            aria-hidden="true"
          >
            <div class="flex flex-col items-start gap-2 w-full">
              <Skeleton
                height="16px"
                width="96px"
                borderRadius="3px"
              />
              <Skeleton
                class="w-full"
                height="34px"
                borderRadius="6px"
              />
            </div>
            <div class="flex gap-4">
              <div class="flex-1 min-w-0 flex flex-col items-start gap-2">
                <Skeleton
                  height="16px"
                  width="120px"
                  borderRadius="3px"
                />
                <Skeleton
                  class="w-full"
                  height="34px"
                  borderRadius="6px"
                />
              </div>
              <div class="flex-1 min-w-0 flex flex-col items-start gap-2">
                <Skeleton
                  height="16px"
                  width="120px"
                  borderRadius="3px"
                />
                <Skeleton
                  class="w-full"
                  height="34px"
                  borderRadius="6px"
                />
              </div>
            </div>
            <div class="flex flex-col items-start gap-2 w-full">
              <Skeleton
                height="16px"
                width="64px"
                borderRadius="3px"
              />
              <Skeleton
                class="w-full"
                height="34px"
                borderRadius="6px"
              />
            </div>
          </div>
          <div
            id="payment-setup-element"
            ref="elementContainer"
            class="stripe-input"
            :class="{ 'absolute inset-0 invisible': !paymentElementReady }"
          />
        </div>
        <p
          v-if="error"
          class="text-xs text-[var(--text-danger)]"
        >
          {{ error }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import ActionButton from '@aziontech/webkit/actions/button'
  import Skeleton from '@aziontech/webkit/skeleton'
  import { useThemeStore } from '@/stores/theme'
  import {
    buildCheckoutAppearance,
    checkoutFonts
  } from '@/templates/checkout-block/helpers/stripe-appearance.js'

  defineOptions({ name: 'payment-method-setup-block' })

  const emit = defineEmits(['readiness-change', 'cancel'])

  const props = defineProps({
    stripeClientService: { type: Function, required: true },
    clientSecret: { type: String, default: '' },
    showHeader: { type: Boolean, default: true }
  })

  const themeStore = useThemeStore()

  const stripe = ref(null)
  const elements = ref(null)
  const paymentElement = ref(null)
  const paymentElementReady = ref(false)
  const paymentElementComplete = ref(false)
  const error = ref('')
  const initVersion = ref(0)

  const emitReadiness = () => {
    emit(
      'readiness-change',
      paymentElementReady.value && paymentElementComplete.value && !error.value
    )
  }

  const unmount = () => {
    try {
      paymentElement.value?.unmount()
    } catch {
      // swallow
    }
    paymentElement.value = null
    elements.value = null
    paymentElementReady.value = false
    paymentElementComplete.value = false
  }

  const initialize = async (clientSecret) => {
    initVersion.value += 1
    const currentVersion = initVersion.value

    unmount()
    error.value = ''
    emitReadiness()

    const secret = String(clientSecret || '').trim()
    if (!secret) {
      emitReadiness()
      return
    }

    try {
      stripe.value = await props.stripeClientService()
      if (currentVersion !== initVersion.value) return

      const appearance = buildCheckoutAppearance(themeStore)
      elements.value = stripe.value.elements({
        clientSecret: secret,
        appearance,
        fonts: checkoutFonts
      })

      if (currentVersion !== initVersion.value) return

      paymentElement.value = elements.value.create('payment', {
        layout: 'tabs'
      })

      paymentElement.value.on('ready', () => {
        if (currentVersion !== initVersion.value) return
        paymentElementReady.value = true
        emitReadiness()
      })

      paymentElement.value.on('change', (event) => {
        if (currentVersion !== initVersion.value) return
        paymentElementComplete.value = Boolean(event?.complete)
        error.value = event?.error?.message || ''
        emitReadiness()
      })

      paymentElement.value.mount('#payment-setup-element')
    } catch (err) {
      error.value = err?.message || 'Unable to load payment fields.'
      emitReadiness()
    }
  }

  const confirmSetup = async () => {
    if (!stripe.value || !elements.value) {
      throw new Error('Payment fields are not ready yet.')
    }

    const submitResult = await elements.value.submit()
    if (submitResult?.error) {
      throw new Error(submitResult.error.message)
    }

    const { error: confirmError, setupIntent } = await stripe.value.confirmSetup({
      elements: elements.value,
      clientSecret: props.clientSecret,
      redirect: 'if_required'
    })

    if (confirmError) {
      throw new Error(confirmError.message)
    }

    const paymentMethodId =
      typeof setupIntent?.payment_method === 'string'
        ? setupIntent.payment_method
        : setupIntent?.payment_method?.id || null

    if (!paymentMethodId) {
      throw new Error('Stripe did not return a payment method id.')
    }

    return paymentMethodId
  }

  onMounted(async () => {
    await initialize(props.clientSecret)
  })

  onBeforeUnmount(() => {
    initVersion.value += 1
    unmount()
  })

  watch(
    () => props.clientSecret,
    async (next) => {
      await initialize(next)
    }
  )

  watch(
    () => themeStore.currentTheme,
    async () => {
      if (!props.clientSecret) return
      await initialize(props.clientSecret)
    }
  )

  defineExpose({
    confirmSetup
  })
</script>
