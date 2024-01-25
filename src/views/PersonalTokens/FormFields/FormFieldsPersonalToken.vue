<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import InputText from 'primevue/inputtext'
  import { useField } from 'vee-validate'
  import Dropdown from 'primevue/dropdown'
  import PrimePassword from 'primevue/password'
  import PrimeTextarea from 'primevue/textarea'
  import Calendar from 'primevue/calendar'
  import PrimeButton from 'primevue/button'
  import { computed } from 'vue'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'
  defineOptions({ name: 'form-fields-personal-token' })

  const props = defineProps({
    personalTokenKey: {
      type: String,
      default: ''
    },
    copyPersonalToken: {
      type: Function,
      required: true
    }
  })

  const personalToken = computed({
    get: () => props.personalTokenKey
  })

  const { value: name, errorMessage: errorName } = useField('name')
  const { value: description, errorMessage: errorDescription } = useField('description')
  const { value: selectedExpiration } = useField('selectedExpiration')
  const { setValue: setExpiration } = useField('expiresAt')
  const { value: customExpiration, errorMessage: errorCustom } = useField('customExpiration')

  const today = new Date()
  const tomorrow = new Date(today.setDate(today.getDate() + 1))

  const options = [
    { label: '1 day', value: '1' },
    { label: '7 days', value: '7' },
    { label: '15 days', value: '15' },
    { label: '30 days', value: '30' },
    { label: '90 days', value: '90' },
    { label: '1 year', value: '365' },
    { label: 'Custom Date', value: 'custom' }
  ]

  const store = useAccountStore()
  const { account } = storeToRefs(store)

  const isCustomDateSelected = computed(() => {
    return selectedExpiration.value === 'custom'
  })

  const minExpirationDate = computed(() => {
    return selectedExpiration.value === 'custom' ? tomorrow : null
  })
  const disabledFields = computed(() => {
    return !!props.personalTokenKey
  })

  const formatToIsoDate = (value) => {
    value.setUTCHours(23, 59, 59, 999)
    return value.toISOString().slice(0, -5)
  }

  const convertOffsetToDecimal = (offset) => {
    const [offsetSign, hourTens, hourUnits, minuteTens, minuteUnits] = offset
    const hours = `${hourTens}${hourUnits}`
    const minutes = `${minuteTens}${minuteUnits}`

    const minuteToDecimalConversion = {
      15: 25,
      30: 50,
      45: 75
    }

    const decimalMinutes = minutes > 0 ? minuteToDecimalConversion[minutes] : minutes

    return `${offsetSign}${hours}.${decimalMinutes}`
  }

  const expiresDate = (expirationDate) => {
    const userOffset = convertOffsetToDecimal(account.value.utc_offset)
    const timeZoneOffsetMinutesToMilli = expirationDate.getTimezoneOffset() * 60000
    const toUTC = expirationDate.getTime() + timeZoneOffsetMinutesToMilli
    const offsetHoursToMilli = userOffset * 3600000

    const userRealDate = new Date(toUTC + offsetHoursToMilli)
    return formatToIsoDate(userRealDate)
  }

  const updateSelectedExpiration = ({ value }) => {
    if (value === 'custom') {
      customExpiration.value = tomorrow
      setExpiration(expiresDate(customExpiration.value))
      return
    }

    const newDateExpiration = new Date()
    newDateExpiration.setDate(newDateExpiration.getDate() + parseInt(selectedExpiration.value))
    setExpiration(expiresDate(newDateExpiration))
  }

  const updateExpiration = (value) => {
    setExpiration(expiresDate(value))
  }

  setExpiration(expiresDate(tomorrow))
</script>

<template>
  <FormHorizontal
    title="General"
    description="Choose a descriptive and easy to remember name. Include a description to specify the token's purpose or usage."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="name"
          class="text-color text-base font-medium"
          >Name *</label
        >
        <span class="p-input-icon-right">
          <i
            class="pi pi-lock text-color-secondary"
            v-if="disabledFields"
          />
          <InputText
            class="w-full"
            v-model="name"
            id="name"
            type="text"
            :class="{ 'p-invalid': errorName }"
            :disabled="disabledFields"
          />
        </span>

        <small
          v-if="errorName"
          class="p-error text-xs font-normal leading-tight"
          >{{ errorName }}
        </small>
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="description"
          class="text-color text-base font-medium"
          >Description</label
        >
        <span class="p-input-icon-right flex items-start">
          <i
            class="pi pi-lock text-color-secondary"
            v-if="disabledFields"
          />
          <PrimeTextarea
            id="description"
            autoResize
            class="w-full"
            :class="{ 'p-invalid': errorDescription }"
            rows="1"
            v-model="description"
            :disabled="disabledFields"
          />
        </span>
        <small
          v-if="errorDescription"
          class="p-error text-xs font-normal leading-tight"
          >{{ errorDescription }}
        </small>
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Token"
    description="Define the token expiration date by selecting one of the suggested date ranges. For security matters, you can only copy the Personal Token right after you create it. In case you need the Personal Token code after that, you must create a new one."
  >
    <template #inputs>
      <div class="flex flex-col gap-2">
        <label
          for="selectedExpiration"
          class="text-color text-base font-medium"
          >Expires within *</label
        >
        <div class="flex sm:flex-row w-full flex-col gap-6">
          <div class="w-full sm:max-w-xs">
            <Dropdown
              class="w-full"
              id="selectedExpiration"
              :options="options"
              @change="updateSelectedExpiration"
              optionLabel="label"
              optionValue="value"
              v-model="selectedExpiration"
              :disabled="disabledFields"
            >
              <template
                #dropdownicon
                v-if="disabledFields"
              >
                <span class="pi pi-lock text-color-secondary" />
              </template>
            </Dropdown>
          </div>
          <div class="w-full sm:max-w-xs">
            <Calendar
              v-if="isCustomDateSelected"
              class="w-full"
              @date-select="updateExpiration"
              v-model="customExpiration"
              placeholder="Select date from calendar"
              dateFormat="dd/mm/yy"
              :minDate="minExpirationDate"
              :class="{ 'p-invalid': errorCustom }"
              showIcon
              :disabled="disabledFields"
            />
            <small
              v-if="errorCustom"
              class="p-error text-xs font-normal leading-tight"
              >{{ errorCustom }}
            </small>
          </div>
        </div>
      </div>

      <div class="flex flex-col w-full gap-2">
        <label
          for="personalToken"
          class="text-color text-base font-medium"
        >
          Personal Token Value
        </label>
        <div
          class="flex gap-6 md:align-items-center max-sm:flex-col max-sm:align-items-baseline flex-wrap max-sm:gap-3"
        >
          <span class="p-input-icon-right w-full flex max-w-lg flex-col items-start gap-2">
            <PrimePassword
              id="personalToken"
              v-model="personalToken"
              type="text"
              class="flex flex-col w-full"
              :feedback="false"
              toggleMask
              disabled
            />
          </span>
          <PrimeButton
            icon="pi pi-clone"
            outlined
            type="button"
            aria-label="Copy Personal Token"
            label="Copy to Clipboard"
            :disabled="!disabledFields"
            @click="copyPersonalToken"
          />
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>
