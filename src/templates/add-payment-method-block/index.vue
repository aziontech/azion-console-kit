<script setup>
  import { computed, ref, inject, onMounted } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import ActionBarBlock from '@/templates/action-bar-block'
  import Sidebar from 'primevue/sidebar'
  import { useAccountStore } from '@/stores/account'
  import ConsoleFeedback from '@/templates/navbar-block/feedback'
  import InlineMessage from 'primevue/inlinemessage'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import LabelBlock from '@/templates/label-block'
  import { useScrollToError } from '@/composables/useScrollToError'
  import InputText from 'primevue/inputtext'
  import { useField } from 'vee-validate'
  import * as yup from 'yup'

  defineOptions({ name: 'add-payment-method-block' })
  const stripePlugin = inject('stripe')

  const accountStore = useAccountStore()
  const stripe = ref(null)
  const isSubmitting = ref(false)
  const stripeComponents = ref(null)
  const cardNumber = ref(null)
  const cardExpiry = ref(null)
  const cardCvc = ref(null)
  const displayError = ref({})
  const { scrollToError } = useScrollToError()
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
  const emit = defineEmits(['update:visible', 'onSuccess', 'onError'])
  const props = defineProps({
    createService: {
      type: Function,
      required: true
    }
  })

  const toast = useToast()

  onMounted(async () => {
    await initializeStripeComponents()
    addStripeComponentsToTemplate()
  })

  const {
    value: cardholderName,
    validate,
    errorMessage: errorCardholderName
  } = useField('cardholderName', yup.string().required('Your card holder name is required'), {
    initialValue: ''
  })

  const initializeStripeComponents = async () => {
    stripe.value = await stripePlugin
    stripeComponents.value = stripe.value.elements()
    const theme = accountStore.currentTheme
    const inputStyles = {
      style: {
        base: {
          fontFamily: "'Roboto', sans-serif",
          color: theme === 'dark' ? '#ffffff' : '#000000'
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
    cardNumber.value = stripeComponents.value.create('cardNumber', {
      ...inputStyles,
      showIcon: true
    })
    cardExpiry.value = stripeComponents.value.create('cardExpiry', inputStyles)
    cardCvc.value = stripeComponents.value.create('cardCvc', inputStyles)
  }

  const handleError = (event, errorType) => {
    const { error } = event
    delete displayError.value[errorType]

    if (error) {
      displayError.value[errorType] = error.message
    }
  }

  const handleBlur = (event) => {
    const element = stripeComponents.value.getElement(event.elementType)
    if (element._empty) {
      displayError.value[event.elementType] = MESSAGE_INPUTS_STRIPE.empty[event.elementType]
      return
    }
    if (element._invalid) {
      displayError.value[event.elementType] = MESSAGE_INPUTS_STRIPE.invalid[event.elementType]
    }
  }

  const addStripeComponentsToTemplate = () => {
    cardNumber.value.mount('#card-number-element')
    cardNumber.value.on('change', (event) => handleError(event, 'cardNumber'))
    cardNumber.value.on('blur', handleBlur)

    cardExpiry.value.mount('#card-expiry-element')
    cardExpiry.value.on('change', (event) => handleError(event, 'cardExpiry'))
    cardExpiry.value.on('blur', handleBlur)

    cardCvc.value.mount('#card-cvc-element')
    cardCvc.value.on('change', (event) => handleError(event, 'cardCvc'))
    cardCvc.value.on('blur', handleBlur)
  }

  const visibleDrawer = computed({
    get: () => props.visible,
    set: (value) => {
      changeVisibleDrawer(value, true)
    }
  })

  const changeVisibleDrawer = (isVisible) => {
    emit('update:visible', isVisible)
  }

  const toggleDrawerVisibility = (isVisible) => {
    visibleDrawer.value = isVisible
  }

  const closeDrawer = () => {
    toggleDrawerVisibility(false)
  }

  const validateCardholderName = async () => {
    await validate()
    delete displayError.value.cardholderName
    if (errorCardholderName.value) {
      displayError.value.cardholderName = errorCardholderName.value
    }
  }

  const showToast = (severity, summary) => {
    const options = {
      closable: true,
      severity: severity,
      summary: severity,
      detail: summary
    }

    toast.add(options)
  }

  const handleSubmit = async () => {
    isSubmitting.value = true
    try {
      await validateCardholderName()
      const { token, error: hasErrors } = await stripe.value.createToken(cardNumber.value, {
        name: cardholderName.value
      })

      if (hasErrors || errorCardholderName.value) {
        scrollToError(displayError.value)
        return
      }

      const accountData = accountStore.account
      const payload = {
        card_address_zip: accountData.postal_code,
        card_country: accountData.country,
        stripe_token: token.id,
        card_id: token.card.id,
        card_brand: token.card.brand,
        card_holder: token.card.name,
        card_last_4_digits: token.card.last4,
        card_expiration_month: token.card.exp_month,
        card_expiration_year: token.card.exp_year
      }
      const response = await props.createService(payload)
      emit('onSuccess', response)
      showToast('success', response.feedback)
      toggleDrawerVisibility(false)
    } catch (error) {
      emit('onError', error)
      showToast('error', error)
    } finally {
      isSubmitting.value = false
    }
  }
</script>

<template>
  <Sidebar
    v-model:visible="visibleDrawer"
    :update:visible="toggleDrawerVisibility"
    position="right"
    :pt="{
      root: { class: 'max-w-4xl w-full' },
      headercontent: { class: 'flex justify-content-between items-center w-full pr-2' },
      content: { class: 'p-8' }
    }"
  >
    <template #header>
      <h2>Add Payment Method</h2>
      <ConsoleFeedback />
    </template>

    <div class="flex w-full">
      <FormHorizontal
        :isDrawer="true"
        title="Payment Method"
      >
        <template #inputs>
          <div class="max-w-3xl w-full flex flex-col gap-8 max-md:gap-6">
            <form
              ref="form"
              @submit.prevent="handleSubmit"
              class="space-y-4"
            >
              <div class="flex flex-wrap gap-6">
                <div class="flex flex-col sm:max-w-xs w-full gap-2">
                  <LabelBlock
                    label="Card Holder Name"
                    :isRequired="true"
                  />
                  <InputText
                    data-testid="payment-methods-form__card-holder-name__input"
                    name="cardholderName"
                    v-model="cardholderName"
                    @blur="validateCardholderName"
                    :class="{ 'p-invalid': errorCardholderName }"
                    placeholder="John Doe"
                  />
                  <small
                    v-if="errorCardholderName"
                    class="p-error text-xs font-normal leading-tight"
                  >
                    {{ errorCardholderName }}
                  </small>
                </div>
                <div
                  class="flex flex-col sm:max-w-xs w-full gap-2"
                  :class="{ 'stripe-input-invalid': displayError.cardNumber }"
                >
                  <LabelBlock
                    label="Card Number"
                    isRequired
                  />
                  <div
                    id="card-number-element"
                    name="cardNumber"
                    data-testid="payment-methods-form__card-number__input"
                    data-cy="input-card-number"
                    class="stripe-input"
                  />
                  <small
                    v-if="displayError.cardNumber"
                    class="p-error text-xs font-normal leading-tight"
                  >
                    {{ displayError.cardNumber }}
                  </small>
                </div>
              </div>
              <div class="flex flex-wrap gap-6">
                <div
                  class="flex flex-col sm:max-w-xs w-full gap-2"
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
                    data-testid="payment-methods-form__card-expiry__input"
                  />
                  <small
                    v-if="displayError.cardExpiry"
                    class="p-error text-xs font-normal leading-tight"
                  >
                    {{ displayError.cardExpiry }}
                  </small>
                </div>
                <div
                  class="flex flex-col sm:max-w-xs w-full gap-2"
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
                    data-testid="payment-methods-form__card-cvc__input"
                  />
                  <small
                    v-if="displayError.cardCvc"
                    class="p-error text-xs font-normal leading-tight"
                  >
                    {{ displayError.cardCvc }}
                  </small>
                </div>
              </div>
              <div class="flex flex-col sm:max-w-lg w-full gap-2">
                <InlineMessage severity="info"
                  >Sensitive data is handled by a PCI-compliant payment partner.</InlineMessage
                >
              </div>
            </form>
          </div>
        </template>
      </FormHorizontal>
    </div>
    <div class="fixed w-full left-0 bottom-0">
      <ActionBarBlock
        @onCancel="closeDrawer"
        @onSubmit="handleSubmit"
        :inDrawer="true"
        :loading="isSubmitting"
      />
    </div>
  </Sidebar>
</template>

<style scoped>
  .stripe-input {
    @apply py-2 px-2 text-base border border-[var(--surface-border)] rounded-md;
  }
  .stripe-input:hover {
    outline: 0 none;
    outline-offset: 0;
    border-color: #f3652b;
  }
  .stripe-input:enabled:focus,
  .stripe-input:focus-visible {
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
</style>
