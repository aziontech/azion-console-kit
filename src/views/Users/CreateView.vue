<template>
  <CreateFormBlock
    pageTitle="Create Users"
    :createService="props.createUsersService"
    :formData="formValues"
    :isValid="meta.valid"
    :cleanFormCallback="resetForm">

    <template #form>
      <h3>User profile</h3>
  
      <div class="flex flex-col gap-2">
        <label for="firstName">First name:</label>
        <InputText
          placeholder="First name"
          v-bind="firstName"
          id="firstName"
          type="text"
          :class="{ 'p-invalid': errors.firstName }"
          v-tooltip.top="errors.firstName"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label for="lastName">Last name:</label>
        <InputText
          placeholder="Last name"
          v-bind="lastName"
          id="lastName"
          type="text"
          :class="{ 'p-invalid': errors.lastName }"
          v-tooltip.top="errors.lastName"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label for="selectedTimezone">Timezone:</label>
        <Dropdown
          :class="{ 'p-invalid': errors.selectedTimezone }"
          v-model="selectedTimezone"
          :options="timezones"
          optionLabel="label"
          optionValue="value"
          class="w-full md:w-14rem"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label for="selectedLanguage">Language:</label>
        <Dropdown
          :class="{ 'p-invalid': errors.selectedLanguage }"
          v-model="selectedLanguage"
          :options="languages"
          optionLabel="label"
          optionValue="value"
          class="w-full md:w-14rem"
          disabled
        />
      </div>
      
      <h3>Contact information</h3>

      <div class="flex flex-col gap-2">
        <label for="email">E-mail:</label>
        <InputText
          placeholder="example@email.com"
          v-bind="email"
          id="email"
          type="text"
          :class="{ 'p-invalid': errors.email }"
          v-tooltip.top="errors.email"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label for="mobile">Mobile:</label>
        <InputText
          placeholder="example@email.com"
          v-bind="mobile"
          id="mobile"
          type="text"
          :class="{ 'p-invalid': errors.mobile }"
          v-tooltip.top="errors.mobile"
        />
      </div>

      <h3>Security settings</h3>
      
      <div class="flex gap-2">
        <label for="owner">Account owner:</label>
        <InputSwitch v-bind="owner" v-model="owner.value" :class="{ 'p-invalid': errors.owner }" />
      </div>

      <div class="flex flex-col gap-2">
        <label for="selectedTeam">Team:</label>
        <Dropdown
          :class="{ 'p-invalid': errors.selectedTeam }"
          v-model="selectedTeam"
          :options="teams"
          optionLabel="label"
          optionValue="value"
          class="w-full md:w-14rem"
          :disabled="owner.value"
        />
      </div>

      <div class="flex gap-2">
        <label for="mfa">Multi-Factor Authentication:</label>
        <InputSwitch v-bind="mfa" v-model="mfa.value" :class="{ 'p-invalid': errors.mfa }" />
      </div>
      {{ formValues }}
      {{ meta.valid }}
      {{ errors }}
    </template>
  </CreateFormBlock>
</template>

<script setup>
import { ref, /*onMounted, */ watch } from 'vue'
import { useForm, /*useField*/ } from 'vee-validate'
import * as yup from 'yup'

import CreateFormBlock from '@/templates/create-form-block'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import InputSwitch from 'primevue/inputswitch'

const props = defineProps({
  createUsersService: {
    type: Function,
    required: true
  }
})

const timezones = ref([
  { label: '(UTC -12:00) Etc/GMT+12', value: 'Etc/GMT+12' },
  { label: '(UTC -11:00) Etc/GMT+11', value: 'Etc/GMT+11' },
  { label: '(UTC -11:00) Pacific/Midway', value: 'Pacific/Midway' },
])
const languages = ref([
  { label: 'English', value: 'en' },
])
const teams = ref([
  { label: 'Default Team', value: '0' },
])

const validationSchema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  selectedTimezone: yup.string().required('Please select an option'),
  selectedLanguage: yup.string(),
  email: yup.string().required(),
  mobile: yup.string().required(),
  owner: yup.boolean().default(false),
  selectedTeam: yup.string(),
  mfa: yup.boolean().required().default(true),
})

const { errors, defineInputBinds, meta, resetForm, values } = useForm({
  validationSchema,
  initialValues: {
    firstName: '',
    lastName: '',
    selectedTimezone: 'Etc/GMT+12',
    selectedLanguage: 'en',
    email: '',
    mobile: '',
    owner: false,
    selectedTeam: '',
    mfa: true,
  }
})

const firstName = defineInputBinds('firstName', { validateOnInput: true })
const lastName = defineInputBinds('lastName', { validateOnInput: true })
const selectedTimezone = ref(values.selectedTimezone)
const selectedLanguage = ref(values.selectedLanguage)
const email = defineInputBinds('email', { validateOnInput: true })
const mobile = defineInputBinds('mobile', { validateOnInput: true })
const owner = defineInputBinds('owner', { validateOnInput: true })
const selectedTeam = ref(values.selectedTeam)
const mfa = defineInputBinds('mfa', { validateOnInput: true })

let formValues = { ...values, selectedTimezone, selectedLanguage, selectedTeam }

watch([selectedTimezone, selectedLanguage, selectedTeam, values], () => {
  formValues = { ...values, selectedTimezone, selectedLanguage, selectedTeam }
})
</script>