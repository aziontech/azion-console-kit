<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Personal Token"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="props.createPersonalTokenService"
        :formData="values"
        :formMeta="meta"
        @on-response="handleResponse"
        :buttonBackList="generatedPersonalToken"
        :callback="false"
        :disabledFeedback="true"
      >
        <template #form>
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
                    v-if="generatedPersonalToken"
                  />
                  <InputText
                    class="w-full"
                    v-bind="name"
                    id="name"
                    type="text"
                    :class="{ 'p-invalid': errors.name }"
                    v-tooltip.top="{ value: errors.name, showDelay: 200 }"
                    :disabled="generatedPersonalToken"
                  />
                </span>

                <small
                  v-if="errors.name"
                  class="p-error text-xs font-normal leading-tight"
                  >{{ errors.name }}
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
                    v-if="generatedPersonalToken"
                  />
                  <TextareaComponent
                    id="description"
                    class="w-full"
                    :class="{ 'p-invalid': errors.description }"
                    rows="1"
                    v-bind="description"
                    :disabled="generatedPersonalToken"
                  />
                </span>
                <small
                  v-if="errors.description"
                  class="p-error text-xs font-normal leading-tight"
                  >{{ errors.description }}
                </small>
              </div>
            </template>
          </FormHorizontal>
          <FormHorizontal
            title="Token"
            description="Define the token expiration date by selecting one of the suggested date ranges. For security matters, you can only copy the Personal Token right after you create it. In case you need the Personal Token code after that, you must create a new one."
          >
            <template #inputs>
              <div class="flex flex-col w-full gap-2">
                <label
                  for="selectedExpiration"
                  class="text-color text-base font-medium"
                  >Expires within *</label
                >
                <div class="flex gap-6">
                  <div>
                    <Dropdown
                      class="w-full"
                      id="selectedExpiration"
                      :options="options"
                      optionLabel="label"
                      optionValue="value"
                      :class="{ 'p-invalid': errors.selectedExpiration }"
                      v-model="selectedExpiration"
                      :disabled="generatedPersonalToken"
                    >
                      <template
                        #dropdownicon
                        v-if="generatedPersonalToken"
                      >
                        <span class="pi pi-lock text-color-secondary" />
                      </template>
                    </Dropdown>
                  </div>
                  <div>
                    <Calendar
                      v-if="isCustomDateSelected"
                      class="w-full"
                      v-model="customExpiration"
                      placeholder="Select date from calendar"
                      :minDate="minExpirationDate"
                      :class="{ 'p-invalid': errors.customExpiration }"
                      showIcon
                      :disabled="generatedPersonalToken"
                    />
                    <small
                      v-if="errors.customExpiration"
                      class="p-error text-xs font-normal leading-tight"
                      >{{ errors.customExpiration }}
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
                      v-model="personalTokenKey"
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
                    :disabled="!generatedPersonalToken"
                    @click="copyPersonalToken"
                  />
                </div>
              </div>
            </template>
          </FormHorizontal>
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import CreateFormBlock from '@/templates/create-form-block-new'

  import FormHorizontal from '@/templates/create-form-block-new/form-horizontal'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'

  import { useToast } from 'primevue/usetoast'
  import InputText from 'primevue/inputtext'

  import Dropdown from 'primevue/dropdown'
  import PrimePassword from 'primevue/password'
  import TextareaComponent from 'primevue/textarea'
  import Calendar from 'primevue/calendar'
  import PrimeButton from 'primevue/button'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'

  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'

  const props = defineProps({
    createPersonalTokenService: {
      type: Function,
      required: true
    }
  })

  const personalTokenKey = ref('')
  const generatedPersonalToken = ref(false)
  const options = ref([
    { label: '1 day', value: '1' },
    { label: '7 days', value: '7' },
    { label: '15 days', value: '15' },
    { label: '30 days', value: '30' },
    { label: '90 days', value: '90' },
    { label: '1 year', value: '365' },
    { label: 'Custom Date', value: 'custom' }
  ])

  const validationSchema = yup.object({
    name: yup
      .string()
      .max(100, 'Name cannot exceed 100 characters')
      .required('Name is a required field'),
    description: yup.string().max(255, 'Description cannot exceed 255 characters'),
    selectedExpiration: yup.string().required('Please select an option'),
    expiresAt: yup.string().required('Please select an option'),
    customExpiration: yup.string().when('selectedExpiration', {
      is: 'custom',
      then: (schema) => schema.required('Expiration date is required field'),
      otherwise: (schema) => schema.nullable()
    })
  })

  const { errors, defineInputBinds, meta, values } = useForm({
    validationSchema,
    initialValues: {
      customExpiration: null,
      selectedExpiration: '1'
    }
  })

  const { value: selectedExpiration } = useField('selectedExpiration')
  const { setValue: setExpiration } = useField('expiresAt')
  const { value: customExpiration } = useField('customExpiration')
  const name = defineInputBinds('name', { validateOnInput: true })
  const description = defineInputBinds('description', { validateOnInput: true })

  const isCustomDateSelected = computed(() => {
    return selectedExpiration.value === 'custom'
  })

  const minExpirationDate = computed(() => {
    if (selectedExpiration.value === 'custom') {
      const today = new Date()
      const tomorrow = today.setDate(today.getDate() + 1)
      return new Date(tomorrow)
    }
    return null
  })

  const formatToIsoDate = (value) => {
    value.setUTCHours(23, 59, 59, 999)
    return value.toISOString().slice(0, -5)
  }

  const convertOffset = (offset) => {
    const [sign, H, h, M, m] = offset
    const hours = `${H}${h}`
    const minutes = `${M}${m}`

    const convert = {
      15: 25,
      30: 50,
      45: 75
    }
    const convertedMinutes = minutes > 0 ? convert[minutes] : minutes

    return `${sign}${hours}.${convertedMinutes}`
  }

  const store = useAccountStore()
  const { account } = storeToRefs(store)

  const expiresDate = (expirationDate) => {
    const userOffset = convertOffset(account.value.utc_offset)
    const timeZoneOffsetMinutesToMilli = expirationDate.getTimezoneOffset() * 60000
    const toUTC = expirationDate.getTime() + timeZoneOffsetMinutesToMilli
    const offsetHoursToMilli = userOffset * 3600000

    const userRealDate = new Date(toUTC + offsetHoursToMilli)
    return formatToIsoDate(userRealDate)
  }

  watch(
    [selectedExpiration, customExpiration],
    () => {
      if (selectedExpiration.value && selectedExpiration.value !== 'custom') {
        const expirationDate = new Date()
        expirationDate.setDate(expirationDate.getDate() + parseInt(selectedExpiration.value))
        setExpiration(expiresDate(expirationDate))
      }

      if (selectedExpiration.value === 'custom' && !!customExpiration.value) {
        setExpiration(expiresDate(customExpiration.value))
      }
    },
    { immediate: true }
  )

  const toast = useToast()
  const handleResponse = ({ feedback, token }) => {
    toast.add({
      closable: false,
      severity: 'success',
      summary: feedback,
      life: 10000
    })
    if (token) {
      personalTokenKey.value = token
      generatedPersonalToken.value = true
    }
  }

  const copyPersonalToken = async () => {
    const toastConfig = {
      closable: false,
      life: 10000,
      severity: 'success',
      summary: 'Personal Token copied to clipboard!'
    }

    try {
      await navigator.clipboard.writeText(personalTokenKey.value)
      toast.add({ ...toastConfig })
    } catch {
      toast.add({
        ...toastConfig,
        severity: 'error',
        detail: 'The Personal Token could not be copied to clipboard. Please try again.'
      })
    }
  }
</script>
