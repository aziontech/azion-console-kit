<script setup>
  import { ref, onMounted } from 'vue'
  import { useField } from 'vee-validate'

  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import InputText from 'primevue/inputtext'
  import Dropdown from 'primevue/dropdown'
  import InputPassword from 'primevue/password'
  import InputSwitch from 'primevue/inputswitch'
  import InputMask from 'primevue/inputmask'
  import Card from 'primevue/card'

  const props = defineProps({
    loadAccountDetailsService: {
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

  const optionsTimezone = ref([])
  const optionsTeams = ref([])
  const isForceMFA = ref(false)
  const optionsCountriesMobile = ref([])
  const filteredCountriesMobile = ref([])
  const optionsLanguage = ref([{ label: 'English', value: 'en' }])

  const { value: firstName, errorMessage: errorFirstName } = useField('firstName')
  const { value: lastName, errorMessage: errorLastName } = useField('lastName')
  const { value: selectedTimezone, errorMessage: errorSelectedTimezone } =
    useField('selectedTimezone')
  const { value: selectedLanguage, errorMessage: errorSelectedLanguage } =
    useField('selectedLanguage')
  const { value: email, errorMessage: errorEmail } = useField('email')
  const { value: selectedCountry, errorMessage: errorSelectedCountry } = useField('selectedCountry')
  const { value: mobile, errorMessage: errorMobile } = useField('mobile')
  const { value: twoFactorEnabled, errorMessage: errorTwoFactorEnabled } =
    useField('twoFactorEnabled')

  const { value: password, errorMessage: errorPassword } = useField('password')
  const { value: oldPassword, errorMessage: errorOldPassword } = useField('oldPassword')


  const fetchCountries = async () => {
    const result = await props.listCountriesPhoneService()
    optionsCountriesMobile.value = result
    filteredCountriesMobile.value = [...optionsCountriesMobile.value]
    selectedCountry.value = optionsCountriesMobile.value[0]
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

  const passwordRequirementsList = ref([
    { label: '> 7 characters', valid: false },
    { label: 'Uppercase letter', valid: false },
    { label: 'Lowercase letter', valid: false },
    { label: 'Special character (e.g. !?<>@#$%)', valid: false }
  ])

  const validation = () => {
    const hasUpperCase = password.value && /[A-Z]/.test(password.value)
    const hasLowerCase = password.value && /[a-z]/.test(password.value)
    const hasSpecialChar = password.value && /[!@#$%^&*(),.?":{}|<>]/.test(password.value)
    const hasMinLength = password.value?.length > 7
    passwordRequirementsList.value[0].valid = hasMinLength
    passwordRequirementsList.value[1].valid = hasUpperCase
    passwordRequirementsList.value[2].valid = hasLowerCase
    passwordRequirementsList.value[3].valid = hasSpecialChar
    return hasMinLength && hasUpperCase && hasLowerCase && hasSpecialChar
  }
</script>

<template>
  <FormHorizontal title="General">
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="firstName"
          class="text-color text-base font-medium"
          >First name *</label
        >
        <InputText
          v-model="firstName"
          id="firstName"
          type="text"
          :class="{ 'p-invalid': errorFirstName }"
        />
        <small
          id="name-help"
          class="p-error"
          >{{ errorFirstName }}</small
        >
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="lastName"
          class="text-color text-base font-medium"
          >Last name *</label
        >
        <InputText
          v-model="lastName"
          id="lastName"
          type="text"
          :class="{ 'p-invalid': errorLastName }"
        />
        <small
          id="name-help"
          class="p-error"
          >{{ errorLastName }}</small
        >
      </div>
      <div class="flex sm:flex-row w-full flex-col gap-6">
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <label
            for="selectedTimezone"
            class="text-color text-base font-medium"
            >Timezone *</label
          >
          <Dropdown
            id="selectedTimezone"
            filter
            :options="optionsTimezone"
            optionLabel="label"
            optionValue="value"
            placeholder="Loading..."
            :loading="!selectedTimezone"
            :class="{ 'p-invalid': errorSelectedTimezone }"
            v-model="selectedTimezone"
          />
        </div>
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <label
            for="selectedLanguage"
            class="text-color text-base font-medium"
            >Language</label
          >
          <Dropdown
            id="selectedLanguage"
            :options="optionsLanguage"
            optionLabel="label"
            optionValue="value"
            :class="{ 'p-invalid': errorSelectedLanguage }"
            v-model="selectedLanguage"
            disabled
          >
            <template #dropdownicon>
              <span class="pi pi-lock text-color-secondary" />
            </template>
          </Dropdown>
        </div>
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal title="Contact information">
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="email"
          class="text-color text-base font-medium"
          >E-mail *</label
        >
        <InputText
          v-model="email"
          id="email"
          type="email"
          placeholder="example@email.com"
          :class="{ 'p-invalid': errorEmail }"
        />
        <small
          id="name-help"
          class="p-error"
          >{{ errorEmail }}</small
        >
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="email"
          class="text-color text-base font-medium"
          >Mobile *</label
        >
        <div class="flex gap-2">
          <div class="p-inputgroup">
            <Dropdown
              id="selectedTimezone"
              filter
              :options="filteredCountriesMobile"
              optionLabel="label"
              placeholder="Loading..."
              :loading="!filteredCountriesMobile.length"
              :class="{ 'p-invalid': errorSelectedCountry }"
              class="w-2/3 surface-border border-r-0"
              v-model="selectedCountry"
            />

            <InputMask
              date="phone"
              v-model="mobile"
              class="w-full"
              mask="?99999999999999999999"
              :class="{ 'p-invalid': errorMobile || !selectedCountry }"
            />
          </div>
        </div>
        <small
          id="name-help"
          class="p-error"
          >{{ errorMobile }}</small
        >
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal title="Security settings">
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="oldPassword"
          class="text-color text-base font-medium"
          >Old password *</label
        >
        <InputPassword
          toggleMask
          v-model="oldPassword"
          id="oldPassword"
          class="w-full"
          :class="{ 'p-invalid': errorOldPassword }"
          :feedback="false"
        />
        <small
          id="name-help"
          class="p-error"
          >{{ errorOldPassword }}</small
        >
      </div>
      <div class="flex flex-col sm:max-w-lg gap-2">
        <label
          for="password"
          class="font-semibold text-sm"
          >New password *</label
        >
        <InputPassword
          toggleMask
          v-model="password"
          id="password"
          class="w-full"
          @input="validation()"
          :class="{ 'p-invalid': errorPassword }"
          :feedback="false"
        />
        <small class="p-error text-xs font-normal leading-tight">{{ errorPassword }}</small>

        <label class="font-semibold text-sm my-2">Must have at least:</label>
        <ul class="text-color-secondary list-inside space-y-3">
          <li
            class="flex gap-3 items-center text-color-secondary"
            :key="i"
            v-for="(requirement, i) in passwordRequirementsList"
          >
            <div class="w-3">
              <span
                class="pi pi-check text-sm text-success-check animate-fadeIn"
                v-if="requirement.valid"
              />
              <div
                class="w-2 h-2 bg-orange-bullet animate-fadeIn"
                v-else
              />
            </div>
            <span>{{ requirement.label }}</span>
          </li>
        </ul>
      </div>
      <Card
        :pt="{
          root: { class: 'shadow-none  rounded-none' },
          body: { class: 'py-4 border-0' },
          content: { class: 'ml-12' },
          title: { class: 'flex items-center text-base m-0 gap-3 font-medium' },
          subtitle: {
            class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
          }
        }"
      >
        <template #title>
          <InputSwitch
            :class="{ 'p-invalid': errorTwoFactorEnabled }"
            :readonly="isForceMFA"
            v-model="twoFactorEnabled"
            inputId="twoFactor"
          />
          <div class="flex-col gap-1">
            <label
              for="twoFactor"
              class="text-color text-sm font-normal"
              >Multi-Factor Authentication</label
            >
          </div>
        </template>

        <template #content>
          <small class="text-color-secondary text-sm">
            Multi-factor authentication adds an extra layer of security to your account. In addition
            to your username and password, you will need an application like Google Authenticator on
            your phone to get verification codes when prompted. Enabling multi-factor
            authentication, you MUST set up an account on Google Authenticator on your next login.
          </small>
        </template>
      </Card>
    </template>
  </FormHorizontal>
</template>
