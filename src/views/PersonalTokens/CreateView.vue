<template>
  <div>
    <Toast />
    <CreateFormBlockWithEvent
      pageTitle="Create Personal Token"
      :createService="props.createPersonalTokenService"
      :formData="values"
      :isValid="meta.valid"
      :cleanFormCallback="resetForm"
      @on-response="handleResponse"
    >
      <template #form>
        <div class="flex flex-col gap-2">
          <label for="name">Personal Token name:</label>
          <InputText
            v-model="name"
            id="name"
            type="text"
            :class="{ 'p-invalid': errors.name }"
            v-tooltip.top="errors.name"
            :disabled="!!personalTokenKey"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="selectedExpiration">Expires in:</label>
          <Dropdown
            id="selectedExpiration"
            :options="options"
            optionLabel="label"
            optionValue="value"
            :class="{ 'p-invalid': errors.selectedExpiration }"
            v-model="selectedExpiration"
            :disabled="!!personalTokenKey"
          />
          <small>{{ TEXT_CONSTANTS.expiresInTooltip }}</small>
        </div>
        <div
          class="flex flex-col gap-2"
          v-if="selectedExpiration === 'custom'"
        >
          <Calendar
            v-model="customExpiration"
            :minDate="minExpirationDate"
            showIcon
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="description">Description:</label>
          <TextareaComponent
            id="description"
            :class="{ 'p-invalid': errors.description }"
            rows="3"
            v-model="description"
            :disabled="!!personalTokenKey"
          />
          <small>{{ TEXT_CONSTANTS.descriptionTipText }}</small>
        </div>
        <div class="flex flex-col gap-2">
          <label for="generatedToken">Generated Token:</label>
          <span class="flex align-items-center">
            <span class="p-input-icon-right w-full">
              <InputText
                id="generatedToken"
                :class="{ 'p-invalid': errors.generatedToken }"
                class="w-full"
                :value="personalTokenKey"
                :placeholder="TEXT_CONSTANTS.generatedTokenPlaceholder"
                :type="tokenField.type"
                readonly
              />
              <i
                v-if="!!personalTokenKey"
                :class="tokenField.icon"
                @click="isTokenVisible = !isTokenVisible"
              />
            </span>
            <PrimeButton
              icon="pi pi-clone"
              text
              aria-label="Copy Personal Token"
              title="Copy Personal Token"
              v-if="!!personalTokenKey"
              @click="copyPersonalToken"
            />
          </span>
          <small>{{ TEXT_CONSTANTS.generatedTokenTooltip }}</small>
        </div>
      </template>
    </CreateFormBlockWithEvent>
  </div>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'
  import { useToast } from 'primevue/usetoast'
  import CreateFormBlockWithEvent from '@/templates/create-form-block/form-with-event'
  import InputText from 'primevue/inputtext'
  import Dropdown from 'primevue/dropdown'
  import TextareaComponent from 'primevue/textarea'
  import Calendar from 'primevue/calendar'
  import PrimeButton from 'primevue/button'
  import Toast from 'primevue/toast'

  const props = defineProps({
    createPersonalTokenService: {
      type: Function,
      required: true
    }
  })

  const TEXT_CONSTANTS = {
    configuration:
      'Define a time range for your Personal Token. For security matters, you can only copy the Personal Token right after you create it. In case you need the Personal Token code after that, you must create a new one.',
    expiresInTooltip:
      'Defines the token expiration date by selecting one of the suggested date ranges below.',
    descriptionTipText: 'Tip: use this field to describe your Personal Token.',
    generatedTokenTooltip:
      'You can see the token only when you create it. If you leave the page you will no longer be able to see or copy it.',
    generatedTokenPlaceholder: 'Your Personal Token will be in this field right after you save it.',
    tokenCopied: 'Personal Token copied to clipboard!',
    tokenNotCopied: 'The Personal Token could not be copied to clipboard. Please try again.'
  }

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
    name: yup.string().required(),
    selectedExpiration: yup.string().required(),
    expires_at: yup.string().required()
  })

  const { errors, meta, resetForm, values } = useForm({ validationSchema })

  const { value: name } = useField('name')
  const { value: selectedExpiration } = useField('selectedExpiration')
  const { value: description } = useField('description')
  const { setValue: setExpiration } = useField('expires_at')

  const isTokenVisible = ref(false)
  const tokenField = computed(() => {
    const icon = isTokenVisible.value ? 'pi pi-eye-slash' : 'pi pi-eye'
    const type = isTokenVisible.value ? 'text' : 'password'
    return { icon, type }
  })

  const customExpiration = ref(null)

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

  watch([selectedExpiration, customExpiration], () => {
    if (selectedExpiration.value && selectedExpiration.value !== 'custom') {
      const expirationDate = new Date()
      expirationDate.setDate(expirationDate.getDate() + parseInt(selectedExpiration.value))
      setExpiration(expiresDate(expirationDate))
    }
    if (selectedExpiration.value === 'custom' && customExpiration.value) {
      setExpiration(expiresDate(customExpiration.value))
    }
  })

  const personalTokenKey = ref('')
  const toast = useToast()

  const handleResponse = (response) => {
    if (response?.body?.key) {
      personalTokenKey.value = response.body.key
    }
  }

  const copyPersonalToken = async () => {
    const toastConfig = {
      closable: true,
      life: 3000,
      severity: 'success',
      summary: TEXT_CONSTANTS.tokenCopied
    }

    try {
      await navigator.clipboard.writeText(personalTokenKey.value)
      toast.add({ ...toastConfig })
    } catch {
      toast.add({ ...toastConfig, severity: 'error', detail: TEXT_CONSTANTS.tokenNotCopied })
    }
  }
</script>
