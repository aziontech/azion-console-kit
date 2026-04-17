<template>
  <div class="border border-default border-solid rounded-md bg-surface">
    <div class="flex items-center justify-between px-6 py-3 border-b border-default">
      <span class="text-lg font-semibold text-default">Payment Method</span>
    </div>

    <div class="flex flex-col gap-8 p-6">
      <form
        ref="form"
        @submit.prevent
        class="space-y-6"
      >
        <!-- Card Holder Name -->
        <div class="flex flex-col gap-2 w-full">
          <LabelBlock
            label="Card Holder Name"
            :isRequired="true"
          />
          <InputText
            data-testid="payment-method-form__card-holder-name__input"
            name="cardholderName"
            v-model="cardHolderName"
            @blur="validateCardholderName"
            :class="{ 'p-invalid': displayError.cardHolderName }"
            placeholder="John Doe"
          />
          <small
            v-if="displayError.cardHolderName"
            class="p-error text-xs font-normal leading-tight"
          >
            {{ displayError.cardHolderName }}
          </small>
        </div>

        <!-- Card Number - Stripe Element -->
        <div
          class="flex flex-col gap-2 w-full"
          :class="{ 'stripe-input-invalid': displayError.cardNumber }"
        >
          <LabelBlock
            label="Card Number"
            isRequired
          />
          <div
            id="card-number-element"
            name="cardNumber"
            data-testid="payment-method-form__card-number__input"
            class="stripe-input"
          />
          <small
            v-if="displayError.cardNumber"
            class="p-error text-xs font-normal leading-tight"
          >
            {{ displayError.cardNumber }}
          </small>
        </div>

        <!-- Expiry and CVC - Stripe Elements -->
        <div class="flex gap-6 w-full">
          <div
            class="flex flex-col gap-2 flex-1"
            :class="{ 'stripe-input-invalid': displayError.cardExpiry }"
          >
            <LabelBlock
              label="Expiration Date"
              isRequired
            />
            <div
              name="cardExpiry"
              id="card-expiry-element"
              class="stripe-input"
              data-testid="payment-method-form__card-expiry__input"
            />
            <small
              v-if="displayError.cardExpiry"
              class="p-error text-xs font-normal leading-tight"
            >
              {{ displayError.cardExpiry }}
            </small>
          </div>
          <div
            class="flex flex-col gap-2 flex-1"
            :class="{ 'stripe-input-invalid': displayError.cardCvc }"
          >
            <LabelBlock
              label="Security Code (CVC/CVV)"
              :isRequired="true"
            />
            <div
              name="cardCvc"
              id="card-cvc-element"
              class="stripe-input"
              data-testid="payment-method-form__card-cvc__input"
            />
            <small
              v-if="displayError.cardCvc"
              class="p-error text-xs font-normal leading-tight"
            >
              {{ displayError.cardCvc }}
            </small>
          </div>
        </div>

        <!-- Info message -->
        <InlineMessage severity="info">
          Sensitive data is handled by a PCI-compliant payment partner.
        </InlineMessage>
      </form>
    </div>
  </div>
</template>

<script setup>
  import { onMounted, ref } from 'vue'
  import InputText from '@aziontech/webkit/inputtext'
  import LabelBlock from '@aziontech/webkit/label'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import { useThemeStore } from '@/stores/theme'

  defineOptions({
    name: 'payment-method-block'
  })

  const props = defineProps({
    stripeClientService: {
      type: Function,
      required: true
    }
  })

  const themeStore = useThemeStore()

  // Stripe refs
  const stripe = ref(null)
  const stripeElements = ref(null)
  const cardNumber = ref(null)
  const cardExpiry = ref(null)
  const cardCvc = ref(null)

  // Form state
  const cardHolderName = ref('')
  const displayError = ref({})

  const MESSAGE_INPUTS_STRIPE = {
    invalid: {
      cardNumber: 'Invalid card number',
      cardExpiry: 'Invalid expiration date',
      cardCvc: 'Invalid security code'
    },
    empty: {
      cardNumber: 'Card number is required',
      cardExpiry: 'Expiration date is required',
      cardCvc: 'Security code is required'
    }
  }

  onMounted(async () => {
    await initializeStripeComponents()
    addStripeComponentsToTemplate()
  })

  const initializeStripeComponents = async () => {
    try {
      stripe.value = await props.stripeClientService()
      stripeElements.value = stripe.value.elements()
      const theme = themeStore.currentTheme
      const inputStyles = {
        style: {
          base: {
            fontFamily: "'Sora', sans-serif",
            color: theme === 'dark' ? '#ffffff' : '#000000',
            fontSize: '14px'
          },
          '::placeholder': {
            color: '#ededed'
          },
          invalid: {
            color: '#fa755a',
            iconColor: '#fa755a'
          }
        }
      }
      cardNumber.value = stripeElements.value.create('cardNumber', {
        ...inputStyles,
        showIcon: true
      })
      cardExpiry.value = stripeElements.value.create('cardExpiry', inputStyles)
      cardCvc.value = stripeElements.value.create('cardCvc', inputStyles)
    } catch (error) {
      //eslint-disable-next-line no-console
      console.error('Failed to initialize Stripe:', error)
    }
  }

  const handleError = (event, errorType) => {
    const { error } = event
    delete displayError.value[errorType]

    if (error) {
      displayError.value[errorType] = error.message
    }
  }

  const handleBlur = (event) => {
    const element = stripeElements.value.getElement(event.elementType)
    if (element._empty) {
      displayError.value[event.elementType] = MESSAGE_INPUTS_STRIPE.empty[event.elementType]
      return
    }
    if (element._invalid) {
      displayError.value[event.elementType] = MESSAGE_INPUTS_STRIPE.invalid[event.elementType]
    }
  }

  const addStripeComponentsToTemplate = () => {
    cardNumber.value?.mount('#card-number-element')
    cardNumber.value?.on('change', (event) => handleError(event, 'cardNumber'))
    cardNumber.value?.on('blur', handleBlur)

    cardExpiry.value?.mount('#card-expiry-element')
    cardExpiry.value?.on('change', (event) => handleError(event, 'cardExpiry'))
    cardExpiry.value?.on('blur', handleBlur)

    cardCvc.value?.mount('#card-cvc-element')
    cardCvc.value?.on('change', (event) => handleError(event, 'cardCvc'))
    cardCvc.value?.on('blur', handleBlur)
  }

  const validateCardholderName = () => {
    delete displayError.value.cardHolderName
    if (!cardHolderName.value || cardHolderName.value.trim() === '') {
      displayError.value.cardHolderName = 'Card holder name is required'
    }
  }

  const validate = async () => {
    const errors = {}

    // Validate card holder name
    if (!cardHolderName.value || cardHolderName.value.trim() === '') {
      errors.cardHolderName = 'Card holder name is required'
    }

    // Validate Stripe elements
    const cardNumberElement = stripeElements.value?.getElement('cardNumber')
    const cardExpiryElement = stripeElements.value?.getElement('cardExpiry')
    const cardCvcElement = stripeElements.value?.getElement('cardCvc')

    if (cardNumberElement?._empty) {
      errors.cardNumber = MESSAGE_INPUTS_STRIPE.empty.cardNumber
    } else if (cardNumberElement?._invalid) {
      errors.cardNumber = MESSAGE_INPUTS_STRIPE.invalid.cardNumber
    }

    if (cardExpiryElement?._empty) {
      errors.cardExpiry = MESSAGE_INPUTS_STRIPE.empty.cardExpiry
    } else if (cardExpiryElement?._invalid) {
      errors.cardExpiry = MESSAGE_INPUTS_STRIPE.invalid.cardExpiry
    }

    if (cardCvcElement?._empty) {
      errors.cardCvc = MESSAGE_INPUTS_STRIPE.empty.cardCvc
    } else if (cardCvcElement?._invalid) {
      errors.cardCvc = MESSAGE_INPUTS_STRIPE.invalid.cardCvc
    }

    displayError.value = { ...displayError.value, ...errors }
    return Object.keys(errors).length > 0 ? errors : null
  }

  const createToken = async () => {
    if (!stripe.value || !cardNumber.value) {
      throw new Error('Stripe is not initialized')
    }

    const { token, error } = await stripe.value.createToken(cardNumber.value, {
      name: cardHolderName.value
    })

    if (error) {
      displayError.value[error.param?.replace('_', '')] = error.message
      throw new Error(error.message)
    }

    return token
  }

  defineExpose({
    validate,
    createToken
  })
</script>

<style scoped>
  .stripe-input {
    @apply py-2 px-2 text-base border border-[var(--surface-border)] rounded-md min-h-[38px];
  }

  .stripe-input:hover {
    outline: 0 none;
    outline-offset: 0;
    border-color: #f3652b;
  }

  .stripe-input:enabled:focus,
  .stripe-input:focus-within {
    outline: 0 none;
    outline-offset: 0;
    box-shadow: 0 0 0 0.2rem rgba(243, 100, 43, 0.6235294118);
    border-color: #f3652b;
  }

  .StripeElement--invalid,
  .stripe-input-invalid .StripeElement--empty {
    border-color: rgb(239 68 68);
  }

  .azion-light .stripe-input {
    @apply bg-[var(--surface-100)];
  }

  .azion-dark .stripe-input {
    @apply bg-[var(--surface-300)];
  }

  :deep(.text-base) {
    font-size: 12px !important;
  }
</style>
