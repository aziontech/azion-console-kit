<template>
  <div class="border border-[var(--border-muted)] border-solid rounded-md bg-surface">
    <div class="flex items-center justify-between px-6 py-3 border-b border-[var(--border-muted)]">
      <span class="text-lg font-semibold text-default">Payment Method</span>
    </div>

    <div class="flex flex-col gap-8 p-6">
      <form
        ref="form"
        @submit.prevent
        class="space-y-6"
      >
        <div
          class="flex flex-col gap-2 w-full"
          :class="{ 'stripe-input-invalid': displayError.paymentElement }"
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
              ref="paymentElementContainer"
              id="payment-element"
              name="paymentElement"
              data-testid="payment-method-form__payment-element__input"
              class="stripe-input"
              :class="{ 'absolute inset-0 opacity-0 pointer-events-none': !paymentElementReady }"
            />
          </div>
          <small
            v-if="displayError.paymentElement"
            class="p-error text-xs font-normal leading-tight"
          >
            {{ displayError.paymentElement }}
          </small>
        </div>

        <div
          class="flex items-center gap-2 rounded-md bg-[#a6a6a61f] px-3 py-2 text-xs leading-snug text-color"
        >
          <i class="pi pi-info-circle text-sm shrink-0" />
          <span>Sensitive data is handled by a PCI-compliant payment partner.</span>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
  import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import Skeleton from '@aziontech/webkit/skeleton'
  import { useAccountStore } from '@/stores/account'
  import { useThemeStore } from '@/stores/theme'
  import {
    buildCheckoutAppearance,
    checkoutFonts
  } from '@/templates/checkout-block/helpers/stripe-appearance.js'
  import { isStaleCheckoutSessionError } from '@/templates/checkout-block/helpers/stripe-error-mapper.js'

  defineOptions({
    name: 'payment-method-block'
  })

  const emit = defineEmits(['readiness-change', 'stale-session', 'element-ready'])

  const props = defineProps({
    stripeClientService: {
      type: Function,
      required: true
    },
    checkoutSessionClientSecret: {
      type: String,
      default: ''
    }
  })

  const themeStore = useThemeStore()
  const accountStore = useAccountStore()

  const stripe = ref(null)
  const checkout = ref(null)
  const paymentElement = ref(null)
  const paymentElementContainer = ref(null)
  const paymentElementReady = ref(false)
  const paymentElementComplete = ref(false)
  const initializationVersion = ref(0)

  const displayError = ref({})

  const CHECKOUT_ERROR_MESSAGES = {
    notReady: 'Payment fields are still loading. Please wait a moment.',
    required: 'Payment details are required',
    initialization: 'Unable to initialize payment. Please refresh and try again.'
  }

  const resetPaymentElementErrors = () => {
    delete displayError.value.paymentElement
  }

  const isPaymentFormReady = () => {
    return Boolean(
      props.checkoutSessionClientSecret &&
      paymentElement.value &&
      paymentElementReady.value &&
      paymentElementComplete.value &&
      !displayError.value.paymentElement
    )
  }

  const emitReadinessChange = () => {
    emit('readiness-change', isPaymentFormReady())
  }

  const markPaymentElementReady = (version) => {
    if (version !== initializationVersion.value || paymentElementReady.value) return

    paymentElementReady.value = true
    resetPaymentElementErrors()
    emit('element-ready')
    emitReadinessChange()
  }

  const unmountPaymentElement = () => {
    paymentElement.value?.unmount()
    paymentElement.value = null
    checkout.value = null
    paymentElementReady.value = false
    paymentElementComplete.value = false
    emitReadinessChange()
  }

  const initializeCheckoutElements = async (clientSecret) => {
    initializationVersion.value += 1
    const currentInitializationVersion = initializationVersion.value

    unmountPaymentElement()
    resetPaymentElementErrors()
    emitReadinessChange()

    const normalizedClientSecret = decodeURIComponent(String(clientSecret || ''))

    if (!normalizedClientSecret) {
      emitReadinessChange()
      return
    }

    try {
      stripe.value = await props.stripeClientService()
      if (currentInitializationVersion !== initializationVersion.value) {
        return
      }

      const appearance = buildCheckoutAppearance(themeStore)
      const checkoutInstance = await stripe.value.initCheckoutElementsSdk({
        clientSecret: normalizedClientSecret,
        elementsOptions: { appearance, fonts: checkoutFonts }
      })

      if (currentInitializationVersion !== initializationVersion.value) {
        return
      }

      checkout.value = checkoutInstance
      paymentElement.value = checkout.value.createPaymentElement({
        layout: 'tabs',
        fields: {
          billingDetails: {
            name: 'never',
            address: {
              postalCode: 'never'
            }
          }
        },
        wallets: {
          applePay: 'auto',
          googlePay: 'auto'
        }
      })

      paymentElement.value.on('ready', () => {
        markPaymentElementReady(currentInitializationVersion)
      })

      paymentElement.value.on('change', (event) => {
        if (currentInitializationVersion !== initializationVersion.value) return

        if (event?.error?.message) {
          paymentElementComplete.value = false
          displayError.value.paymentElement = event.error.message
          emitReadinessChange()
          return
        }

        paymentElementComplete.value = Boolean(event?.complete)

        if (paymentElementComplete.value) {
          resetPaymentElementErrors()
        }

        emitReadinessChange()
      })

      paymentElement.value.on('loaderror', (event) => {
        if (currentInitializationVersion !== initializationVersion.value) return
        displayError.value.paymentElement =
          event?.error?.message || 'Unable to load payment fields. Please refresh and try again.'
        emitReadinessChange()
      })

      paymentElement.value.mount(paymentElementContainer.value)
    } catch (error) {
      if (currentInitializationVersion !== initializationVersion.value) {
        return
      }

      // If Stripe rejected the secret because the underlying session is gone
      // (expired / already consumed / wrong env), ask the parent to recover
      // by invalidating the cached SO and re-issuing a fresh session. We
      // suppress the inline error in this case so the user sees a loading
      // state rather than a scary "Unable to initialize" while recovery
      // runs.
      if (isStaleCheckoutSessionError(error)) {
        emit('stale-session', { reason: 'no_such_checkout_session' })
        emitReadinessChange()
        return
      }

      // Failure surfaces in the inline payment-element error message;
      // Stripe.js also logs the underlying cause to its own console plugin.
      displayError.value.paymentElement = CHECKOUT_ERROR_MESSAGES.initialization
      emitReadinessChange()
    }
  }

  const validate = async () => {
    const errors = {}

    if (!props.checkoutSessionClientSecret) {
      errors.paymentElement = CHECKOUT_ERROR_MESSAGES.required
    } else if (!paymentElement.value) {
      errors.paymentElement = CHECKOUT_ERROR_MESSAGES.initialization
    } else if (!paymentElementReady.value) {
      errors.paymentElement = CHECKOUT_ERROR_MESSAGES.notReady
    } else if (displayError.value.paymentElement) {
      errors.paymentElement = displayError.value.paymentElement
    }

    displayError.value = { ...displayError.value, ...errors }
    return Object.keys(errors).length > 0 ? errors : null
  }

  const confirmCheckoutSession = async () => {
    if (!checkout.value) {
      throw new Error('Checkout session is not initialized. Please try again.')
    }

    const checkoutEmail = String(accountStore.accountData?.email || '').trim()
    if (!checkoutEmail) {
      throw new Error('Account email is missing. Please reload the page and try again.')
    }

    const actions = await checkout.value.loadActions()
    const actionsError = actions?.type === 'error' ? actions.error : null

    if (actionsError?.message) {
      throw new Error(actionsError.message)
    }

    const confirmResult = await actions.actions.confirm({
      redirect: 'if_required',
      email: checkoutEmail
    })
    if (confirmResult?.type === 'error') {
      throw new Error(confirmResult.error?.message || 'Payment confirmation failed.')
    }

    return {
      type: confirmResult?.type,
      status: confirmResult?.status,
      session: confirmResult?.session,
      paymentIntent: confirmResult?.session?.payment_intent || null
    }
  }

  onMounted(async () => {
    await initializeCheckoutElements(props.checkoutSessionClientSecret)
    emitReadinessChange()
  })

  onBeforeUnmount(() => {
    initializationVersion.value += 1
    unmountPaymentElement()
  })

  watch(
    () => props.checkoutSessionClientSecret,
    async (newClientSecret) => {
      await initializeCheckoutElements(newClientSecret)
    }
  )

  watch(
    () => themeStore.currentTheme,
    async () => {
      if (!props.checkoutSessionClientSecret) return
      await initializeCheckoutElements(props.checkoutSessionClientSecret)
    }
  )

  defineExpose({
    validate,
    confirmCheckoutSession
  })
</script>
