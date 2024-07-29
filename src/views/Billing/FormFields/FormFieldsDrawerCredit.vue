<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import InputNumber from 'primevue/inputnumber'
  import LabelBlock from '@/templates/label-block'
  import { useField } from 'vee-validate'
  import InlineMessage from 'primevue/inlinemessage'
  import InputText from 'primevue/inputtext'
  import { ref } from 'vue'
  import cardFlagBlock from '@templates/card-flag-block'
  import { useRoute, useRouter } from 'vue-router'

  const { value: amount, errorMessage } = useField('amount')

  const props = defineProps({
    cardDefault: {
      type: Object,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    closeDrawer: {
      type: Function,
      required: true
    }
  })

  const card = ref(props.cardDefault?.cardData)

  const VIEW_BILLING_TABS_PAYMENT = {
    name: 'billing-tabs',
    params: {
      tab: 'payment'
    }
  }

  const router = useRouter()
  const route = useRoute()

  const goToPaymentMethod = () => {
    const { name, params } = VIEW_BILLING_TABS_PAYMENT
    if (route.name === name && route.params.tab === params.tab) {
      props.closeDrawer()
      return
    }
    router.push({ name, params })
  }
</script>

<template>
  <FormHorizontal
    :isDrawer="true"
    title="Credit Amount"
  >
    <template #inputs>
      <div class="flex gap-6 max-sm:flex-col">
        <div class="flex flex-col w-full flex-1 gap-2">
          <LabelBlock
            for="field-amount"
            label="Amount"
            isRequired
          />
          <div
            class="p-inputgroup h-fit"
            :class="{ 'border border-red-500 rounded-md surface-border': errorMessage }"
          >
            <div class="p-inputgroup-addon">$</div>

            <InputNumber
              inputId="field-amount"
              v-model="amount"
              data-testid="credit-form__amount__input"
              placeholder="99.99"
              :inputClass="errorMessage ? 'border-red-500' : ''"
              :max-fraction-digits="2"
              :min-fraction-digits="2"
              :min="0.5"
              highlight-on-focus
              :disabled="props.loading"
              :pt="{
                input: {
                  name: 'amount'
                }
              }"
            />
          </div>

          <small
            v-if="errorMessage"
            class="p-error text-xs font-normal leading-tight"
          >
            {{ errorMessage }}
          </small>
        </div>

        <div class="flex flex-col w-full flex-1 gap-2">
          <label
            for="field-card"
            class="text-color text-base font-medium leading-5 flex gap-1 align-items-center"
          >
            Payment method
          </label>
          <div class="p-inputgroup h-fit">
            <div class="p-inputgroup-addon">
              <cardFlagBlock :cardFlag="card.cardBrand" />
            </div>
            <InputText
              v-model="card.cardNumber"
              readonly
              disabled
              type="text"
            />
          </div>
          <small class="text-xs text-color-secondary font-normal leading-5">
            Default payment method selected.
          </small>
        </div>
      </div>
      <InlineMessage
        severity="info"
        class="text-sm"
      >
        The credit balance will be included in the monthly invoices, along with all consumption up
        to the last day of the month. Change
        <span
          @click="goToPaymentMethod"
          class="text-[var(--text-color-link)] cursor-pointer"
        >
          payment method.
        </span>
      </InlineMessage>
    </template>
  </FormHorizontal>
</template>
