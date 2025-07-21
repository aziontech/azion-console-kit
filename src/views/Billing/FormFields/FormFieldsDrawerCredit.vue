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
  import FieldText from '@/templates/form-fields-inputs/fieldText.vue'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown.vue'

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

  <FormHorizontal
    :isDrawer="true"
    title="Address Information"
    description="Insert address information for the account."
  >
    <template #inputs>
      jfhbhfjbfhjbfjhfbjbfjhbfjhb
      <div class="flex flex-col gap-6 md:gap-8 md:flex-row">
        <div class="flex flex-col w-full gap-2 sm:max-w-lg">
          <FieldText
            data-testid="account-settings__postal-code"
            label="Postal Code"
            required
            name="postalCode"
            placeholder="00.000.000-00"
            :value="postalCode"
            description="Postal code of the account owner."
          />
        </div>
        <div class="flex flex-col w-full gap-2 sm:max-w-lg">
          <FieldDropdown
            label="Country"
            required
            name="country"
            :options="countriesOptions.options"
            :loading="!countriesOptions.done"
            @change="resetRegionAndCity"
            optionValue="geonameId"
            optionLabel="name"
            :value="country"
            filter
            appendTo="self"
            description="Account owner's country."
            data-testid="account-settings__country"
          />
        </div>
      </div>
      <div class="flex flex-col gap-6 md:gap-8 md:flex-row">
        <div class="flex flex-col w-full gap-2 sm:max-w-lg">
          <FieldDropdown
            label="State/Region"
            required
            name="region"
            :options="regionsOptions.options"
            :loading="!regionsOptions.done"
            optionValue="geonameId"
            optionLabel="name"
            :value="region"
            filter
            appendTo="self"
            :disabled="hasNoCountryListOrNotSelected"
            description="Account owner's state or region."
            data-testid="account-settings__region"
          />
        </div>
        <div class="flex flex-col w-full gap-2 sm:max-w-lg">
          <FieldDropdown
            label="City"
            required
            name="city"
            :options="citiesOptions.options"
            :loading="!citiesOptions.done"
            optionValue="geonameId"
            optionLabel="name"
            :value="city"
            filter
            appendTo="self"
            :disabled="hasNoRegionListOrNotSelected"
            description="Account owner's city."
            data-testid="account-settings__city"
          />
        </div>
      </div>
      <div class="flex flex-col gap-6 md:gap-8 md:flex-row">
        <div class="flex flex-col w-full gap-2 sm:max-w-lg">
          <FieldText
            label="Address"
            required
            name="address"
            placeholder="123 Example Ave."
            :value="address"
            description="Account owner's street address."
            data-testid="account-settings__address"
          />
        </div>
        <div class="flex flex-col w-full gap-2 sm:max-w-lg">
          <FieldText
            label="Apartment, floor, etc."
            name="complement"
            placeholder="1st floor"
            :value="complement"
            description="Additional information for the address."
            data-testid="account-settings__complement"
          />
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>
