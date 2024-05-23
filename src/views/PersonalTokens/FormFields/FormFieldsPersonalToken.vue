<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import Calendar from 'primevue/calendar'
  import Dropdown from 'primevue/dropdown'
  import InputText from 'primevue/inputtext'
  import PrimeTextarea from 'primevue/textarea'
  import { useField } from 'vee-validate'
  import { computed } from 'vue'

  defineOptions({ name: 'form-fields-personal-token' })

  const props = defineProps({
    personalTokenKey: {
      type: String,
      default: ''
    },
    copyPersonalToken: {
      type: Function,
      required: true
    },
    userUtcOffset: {
      type: String,
      default: ''
    },
    convertDateToLocalTimezone: {
      type: Function,
      required: true
    }
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

  const isCustomDateSelected = computed(() => {
    return selectedExpiration.value === 'custom'
  })

  const minExpirationDate = computed(() => {
    return selectedExpiration.value === 'custom' ? tomorrow : null
  })

  const disabledFields = computed(() => {
    return !!props.personalTokenKey
  })

  /**
   * Updates the selected expiration date.
   * If the selected value is 'custom', it sets the expiration date to tomorrow.
   * Otherwise, it sets the expiration date to the selected number of days from today.
   *
   * @param {Object} selectedOption - The selected option from the dropdown.
   * @param {string} selectedOption.value - The value of the selected option.
   */
  const updateSelectedExpiration = ({ value: selectedValue }) => {
    if (selectedValue === 'custom') {
      customExpiration.value = tomorrow
      const customExpirationInUserTimezone = props.convertDateToLocalTimezone(
        customExpiration.value,
        props.userUtcOffset
      )
      setExpiration(customExpirationInUserTimezone)
      return
    }

    const newExpirationDate = new Date()
    const daysToAdd = parseInt(selectedExpiration.value)
    newExpirationDate.setDate(newExpirationDate.getDate() + daysToAdd)
    const newExpirationInUserTimezone = props.convertDateToLocalTimezone(
      newExpirationDate,
      props.userUtcOffset
    )
    setExpiration(newExpirationInUserTimezone)
  }

  /**
   * Updates the expiration date.
   *
   * @param {Date} newExpirationDate - The new expiration date.
   */
  const updateExpiration = (newExpirationDate) => {
    const newExpirationInUserTimezone = props.convertDateToLocalTimezone(
      newExpirationDate,
      props.userUtcOffset
    )
    setExpiration(newExpirationInUserTimezone)
  }
</script>

<template>
  <FormHorizontal
    title="General"
    description=""
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
        <small class="text-xs text-color-secondary font-normal leading-5">
          Give a unique and descriptive name to identify the personal token.
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
        <small class="text-xs text-color-secondary font-normal leading-5">
          Include a description to specify the token's purpose or usage.
        </small>
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Token"
    description="Define the token expiration date by selecting one of the suggested date ranges. For security matters, the personal token will only be available right after it's created."
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
              appendTo="self"
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
    </template>
  </FormHorizontal>
</template>
