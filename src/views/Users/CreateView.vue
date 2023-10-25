<template>
  <div>
    <CreateFormBlock
      pageTitle="Create User"
      :createService="props.createUsersService"
      :formData="values"
      :isValid="meta.valid"
      :cleanFormCallback="resetForm"
    >
      <template #form>
        <div class="flex flex-col gap-2">
          <label for="name">First name: *</label>
          <InputText
            v-model="firstName"
            id="firstName"
            type="text"
            :class="{ 'p-invalid': errors.firstName }"
            v-tooltip.top="errors.firstName"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="name">Last name: *</label>
          <InputText
            v-model="lastName"
            id="lastName"
            type="text"
            :class="{ 'p-invalid': errors.lastName }"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="selectedTimezone">Timezone: *</label>
          <Dropdown
            id="selectedTimezone"
            filter
            :options="optionsTimezone"
            optionLabel="label"
            optionValue="value"
            placeholder="Loading..."
            :loading="!selectedTimezone"
            :class="{ 'p-invalid': errors.selectedTimezone }"
            v-model="selectedTimezone"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="selectedLanguage">Language:</label>
          <Dropdown
            id="selectedLanguage"
            :options="optionsLanguage"
            optionLabel="label"
            optionValue="value"
            :class="{ 'p-invalid': errors.selectedLanguage }"
            v-model="selectedLanguage"
            disabled
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="email">E-mail: *</label>
          <InputText
            v-model="email"
            id="email"
            type="email"
            placeholder="example@email.com"
            :class="{ 'p-invalid': errors.email }"
            v-tooltip.top="errors.email"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="mobile">Mobile: *</label>
          <div class="flex flex-row gap-2">
            <AutoComplete
              :suggestions="filteredCountriesMobile"
              optionLabel="labelFormat"
              dropdown
              :loading="!optionsCountriesMobile.length"
              :class="{ 'p-invalid': errors.selectedCountry }"
              v-model="selectedCountry"
              forceSelection
              @complete="search"
            >
              <template #option="slotProps">
                <div
                  v-if="slotProps.option"
                  class="flex align-items-center"
                >
                  <div>{{ slotProps.option.label }}</div>
                </div>
              </template>
            </AutoComplete>

            <InputMask
              date="phone"
              v-model="mobile"
              class="w-full"
              mask="?99999999999999999999"
              :class="{ 'p-invalid': errors.mobile && !selectedCountry }"
              v-tooltip.top="errors.mobile"
            />
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <label for="enable-mutual-authentication">Account owner:</label>
          <InputSwitch
            :class="{ 'p-invalid': errors.userIsOwner }"
            :disabled="accountIsOwner"
            :readonly="accountIsOwner"
            v-model="userIsOwner"
            @click="handleUserIsOwner"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="teams">Teams:</label>
          <MultiSelect
            display="chip"
            filter
            id="teams"
            :disabled="userIsOwner"
            :loading="!optionsTeams.length"
            :options="optionsTeams"
            optionLabel="label"
            optionValue="value"
            placeholder="Nothing selected"
            :maxSelectedLabels="5"
            :class="{ 'p-invalid': errors.selectedTeam }"
            v-model="selectedTeam"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="enable-mutual-authentication">Multi-Factor Authentication:</label>
          <InputSwitch
            :class="{ 'p-invalid': errors.twoFactorEnabled }"
            :readonly="isForceMFA"
            v-model="twoFactorEnabled"
          />
        </div>
      </template>
    </CreateFormBlock>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'
  import CreateFormBlock from '@/templates/create-form-block'
  import InputText from 'primevue/inputtext'
  import AutoComplete from 'primevue/autocomplete'
  import Dropdown from 'primevue/dropdown'
  import InputSwitch from 'primevue/inputswitch'
  import MultiSelect from 'primevue/multiselect'
  import InputMask from 'primevue/inputmask'

  const props = defineProps({
    loadAccountDetailsService: {
      type: Function,
      required: true
    },
    createUsersService: {
      type: Function,
      required: true
    },
    listTimezonesService: {
      type: Function,
      required: true
    },
    listCountriesPhoneService: {
      type: Function,
      required: true
    },
    listTeamsService: {
      type: Function,
      required: true
    }
  })

  const store = useAccountStore()
  const accountIsOwner = ref(false)
  const optionsTimezone = ref([])
  const optionsTeams = ref([])
  const isForceMFA = ref(false)
  const optionsCountriesMobile = ref([])
  const filteredCountriesMobile = ref([])
  const { account } = storeToRefs(store)
  const optionsLanguage = ref([{ label: 'English', value: 'en' }])

  const validationSchema = yup.object({
    firstName: yup.string().required().max(30),
    lastName: yup.string().required().max(30),
    selectedTimezone: yup.string().required(),
    selectedLanguage: yup.string(),
    email: yup.string().email().required().max(254),
    selectedCountry: yup.object().required(),
    mobile: yup.string().required().max(20),
    userIsOwner: yup.boolean(),
    selectedTeam: yup.array(),
    mfa: yup.boolean()
  })

  const { errors, meta, resetForm, values } = useForm({
    validationSchema,
    initialValues: {
      userIsOwner: false,
      mobile: '',
      selectedTeam: [],
      twoFactorEnabled: false,
      selectedLanguage: 'en'
    }
  })

  const { value: firstName } = useField('firstName')
  const { value: lastName } = useField('lastName')
  const { value: selectedTimezone } = useField('selectedTimezone')
  const { value: selectedLanguage } = useField('selectedLanguage')
  const { value: email } = useField('email')
  const { value: selectedCountry } = useField('selectedCountry')
  const { value: mobile } = useField('mobile')
  const { value: userIsOwner } = useField('userIsOwner')
  const { value: selectedTeam } = useField('selectedTeam')
  const { value: twoFactorEnabled } = useField('twoFactorEnabled')

  const fetchCountries = async () => {
    const result = await props.listCountriesPhoneService()
    optionsCountriesMobile.value = result
  }
  const fetchTimezone = async () => {
    const result = await props.listTimezonesService()
    selectedTimezone.value = result.defaultSelected
    optionsTimezone.value = result.listTimeZones
  }
  const fetchDetailAccount = async () => {
    const account = await props.loadAccountDetailsService()
    isForceMFA.value = account?.is_enabled_mfa_to_all_users
    twoFactorEnabled.value = isForceMFA.value
  }
  const fetchTeams = async () => {
    const result = await props.listTeamsService()
    optionsTeams.value = result
  }

  onMounted(async () => {
    await fetchCountries()
    await fetchTimezone()
    await fetchTeams()
    await fetchDetailAccount()
  })

  const search = (event) => {
    if (!event.query.trim().length) {
      filteredCountriesMobile.value = [...optionsCountriesMobile.value]
    } else {
      filteredCountriesMobile.value = optionsCountriesMobile.value.filter((countryMobile) => {
        return countryMobile.label.toLowerCase().includes(event.query.toLowerCase())
      })
    }
  }

  const handleUserIsOwner = () => {
    if (!userIsOwner.value) {
      selectedTeam.value = []
    }
  }

  accountIsOwner.value = account?.is_account_owner
  userIsOwner.value = accountIsOwner.value
</script>
