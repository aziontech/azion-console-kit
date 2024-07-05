<script setup>
  import { computed, ref, inject, onMounted } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import ActionBarBlock from '@/templates/action-bar-block'
  import GoBack from '@/templates/action-bar-block/go-back'
  import Sidebar from 'primevue/sidebar'
  import { useAccountStore } from '@/stores/account'
  import FeedbackFish from '@/templates/navbar-block/feedback-fish'
  import InlineMessage from 'primevue/inlinemessage'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import LabelBlock from '@/templates/label-block'
  defineOptions({
    name: 'add-payment-method-block'
  })
  const stripePromise = inject('stripe')
  const accountStore = useAccountStore()
  const stripe = ref(null)
  const isSubmitting = ref(false)
  const elements = ref(null)
  const cardNumber = ref(null)
  const cardExpiry = ref(null)
  const cardCvc = ref(null)
  const cardholderName = ref('')

  const emit = defineEmits(['update:visible', 'onSuccess', 'onError'])
  const props = defineProps({
    createService: {
      type: Function,
      required: true
    }
  })

  const toast = useToast()
  const showGoBack = ref(false)
  const appearance = {
    rules: {
      '.Input': {
        color: 'var(--text-color)',
      },

      // See all supported class names and selector syntax below
    }
  };


  onMounted(async () => {
    stripe.value = await stripePromise
    elements.value = stripe.value.elements()

    cardNumber.value = elements.value.create('cardNumber', {
      style: {
        base: {
          fontFamily: "'Roboto', sans-serif",
        },
        '::placeholder': {
          color: '#ededed'
        },
        invalid: {
          color: '#fa755a',
          iconColor: '#fa755a'
        }
      },
      showIcon: true
    })

    cardExpiry.value = elements.value.create('cardExpiry', {
      style: {
        base: {
          fontFamily: "'Roboto', sans-serif",
        },
        '::placeholder': {
          color: '#ededed'
        },
        invalid: {
          color: '#fa755a',
          iconColor: '#fa755a'
        }
      },
    })

    cardCvc.value = elements.value.create('cardCvc', {
      style: {
        base: {
          fontFamily: "'Roboto', sans-serif",
        },
        '::placeholder': {
          color: '#ededed'
        },
        invalid: {
          color: '#fa755a',
          iconColor: '#fa755a'
        }
      },
    })

    cardNumber.value.mount('#card-number-element')
    cardExpiry.value.mount('#card-expiry-element')
    cardCvc.value.mount('#card-cvc-element')
  })

  const visibleDrawer = computed({
    get: () => props.visible,
    set: (value) => {
      changeVisisbleDrawer(value, true)
    }
  })

  const changeVisisbleDrawer = (isVisible) => {
    emit('update:visible', isVisible)
  }

  const toggleDrawerVisibility = (isVisible) => {
    visibleDrawer.value = isVisible
  }

  const closeDrawer = () => {
    toggleDrawerVisibility(false)
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
    const { token } = await stripe.value.createToken(cardNumber.value, {
      name: cardholderName.value
    })
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
    try {
      const response = await props.createService(payload)
      emit('onSuccess', response)
      showToast('Success', response.feedback)
      showGoBack.value = props.showBarGoBack
      toggleDrawerVisibility(false)
    } catch (error) {
      emit('onError', error)
      showToast('error', error)
    }
    isSubmitting.value = false
  }

  const handleGoBack = () => {
    showGoBack.value = false
    toggleDrawerVisibility(false)
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
      <FeedbackFish />
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
                    isRequired="true"
                  />
                  <input
                    id="cardholder-name"
                    v-model="cardholderName"
                    class="p-component p-inputtext"
                    placeholder="Morgana Johann"
                  />
                </div>
                <div class="flex flex-col sm:max-w-xs w-full gap-2">
                  <LabelBlock
                    label="Card Number"
                    isRequired="true"
                  />
                  <div
                    id="card-number-element"
                    class="stripe-input"
                  ></div>
                </div>
              </div>
              <div class="flex flex-wrap gap-6">
                <div class="flex flex-col sm:max-w-xs w-full gap-2">
                  <LabelBlock
                    label="Expiration Date"
                    isRequired="true"
                  />
                  <div
                    id="card-expiry-element"
                    class="stripe-input"
                  ></div>
                </div>
                <div class="flex flex-col sm:max-w-xs w-full gap-2">
                  <LabelBlock
                    label="Security Code (CVC)"
                    isRequired="true"
                  />
                  <div
                    id="card-cvc-element"
                    class="stripe-input"
                  ></div>
                </div>
              </div>
              <div class="flex flex-col sm:max-w-lg w-full gap-2">
                <InlineMessage severity="info"
                  >This is a sensitive data is handled by a PCI Compliant payment
                  partner.</InlineMessage
                >
              </div>
              <div
                id="card-errors"
                class="card-errors"
                role="alert"
              ></div>
            </form>
          </div>
        </template>
      </FormHorizontal>
    </div>
    <div class="fixed w-full left-0 bottom-0">
      <GoBack
        :goBack="handleGoBack"
        v-if="showGoBack"
        :inDrawer="true"
      />
      <ActionBarBlock
        v-else
        @onCancel="closeDrawer"
        @onSubmit="handleSubmit"
        :inDrawer="true"
        :loading="isSubmitting"
      />
    </div>
  </Sidebar>
</template>
<style scoped>
  /* Estilos para os elementos Stripe */
  .stripe-input {
    @apply py-2 px-2 text-base border border-[var(--surface-border)] rounded-md;
  }
  .stripe-input:hover {
    outline: 0 none;
    outline-offset: 0;
    border-color: #f3652b;
  }
  .stripe-input:enabled:focus, .stripe-input:focus-visible {
    outline: 0 none;
    outline-offset: 0;
    box-shadow: 0 0 0 0.2rem rgba(243, 100, 43, 0.6235294118);
    border-color: #f3652b;
  }
  .azion-light .stripe-input {
    @apply bg-[var(--surface-100)];
  }
  .azion-dark .stripe-input {
    @apply bg-[var(--surface-300)];
  }

</style>
