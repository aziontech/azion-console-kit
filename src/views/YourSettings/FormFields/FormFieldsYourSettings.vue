<script setup>
  import { useField } from 'vee-validate'
  import { computed, onMounted, ref, watch } from 'vue'

  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import Dropdown from 'primevue/dropdown'
  import InputMask from 'primevue/inputmask'
  import InputText from 'primevue/inputtext'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import InputPassword from 'primevue/password'

  const props = defineProps({
    listTimezonesService: {
      type: Function,
      required: true
    },
    listCountriesPhoneService: {
      type: Function,
      required: true
    }
  })

  const optionsTimezone = ref([])
  const isForceMFA = ref(false)
  const optionsCountriesMobile = ref([])
  const filteredCountriesMobile = ref([])
  const optionsLanguage = ref([{ label: 'English', value: 'en' }])
  const selectedCountryCallCode = ref(null)

  const { value: firstName, errorMessage: errorFirstName } = useField('firstName')
  const { value: lastName, errorMessage: errorLastName } = useField('lastName')
  const { value: timezone, errorMessage: errorTimezone } = useField('timezone')
  const { value: language, errorMessage: errorLanguage } = useField('language')
  const { value: email, errorMessage: errorEmail } = useField('email')
  const { value: countryCallCode, errorMessage: errorCountryCallCode } = useField('countryCallCode')
  const { value: mobile, errorMessage: errorMobile } = useField('mobile')
  const { value: password, errorMessage: errorPassword } = useField('password')
  const { value: oldPassword, errorMessage: errorOldPassword } = useField('oldPassword')
  const { value: confirmPassword, errorMessage: errorConfirmPassword } = useField('confirmPassword')

  const fetchCountries = async () => {
    const result = await props.listCountriesPhoneService()
    optionsCountriesMobile.value = result
    filteredCountriesMobile.value = [...optionsCountriesMobile.value]
    if (countryCallCode.value) {
      selectedCountryCallCode.value = optionsCountriesMobile.value.find(
        (item) => item.value === countryCallCode.value
      )
    }
    if (!countryCallCode.value) {
      selectedCountryCallCode.value = optionsCountriesMobile.value[0]
    }
  }

  const fetchTimezone = async () => {
    const result = await props.listTimezonesService()
    optionsTimezone.value = result.listTimeZones
  }

  onMounted(async () => {
    await fetchCountries()
    await fetchTimezone()
  })

  const passwordRequirementsList = ref([
    { label: '8 characters', valid: false },
    { label: '1 uppercase letter', valid: false },
    { label: '1 lowercase letter', valid: false },
    { label: '1 special character (example: !?<>@#$%)', valid: false }
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

  watch(selectedCountryCallCode, (newCountryCallCode) => {
    countryCallCode.value = newCountryCallCode.value
  })

  const isLoadingCountry = computed(() => {
    return !filteredCountriesMobile.value.length
  })
</script>

<template>
  <FormHorizontal
    title="Profile"
    description="Modify the personal information of the account."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="firstName"
          class="text-color text-base font-medium"
          >First Name *</label
        >
        <InputText
          placeholder="John"
          v-model="firstName"
          id="firstName"
          type="text"
          :class="{ 'p-invalid': errorFirstName }"
        />
        <small class="text-xs text-color-secondary font-normal leading-5">
          The first name of the user.</small
        >
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
          >Last Name *</label
        >
        <InputText
          placeholder="Smith"
          v-model="lastName"
          id="lastName"
          type="text"
          :class="{ 'p-invalid': errorLastName }"
        />
        <small class="text-xs text-color-secondary font-normal leading-5">
          The last name of the user.</small
        >
        <small
          id="name-help"
          class="p-error"
          >{{ errorLastName }}</small
        >
      </div>
      <div class="flex sm:flex-row w-full flex-col gap-6">
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <label
            for="timezone"
            class="text-color text-base font-medium"
            >Timezone *</label
          >
          <Dropdown
            filter
            autoFilterFocus
            appendTo="self"
            id="timezone"
            :options="optionsTimezone"
            optionLabel="label"
            optionValue="value"
            placeholder="Loading..."
            :loading="!timezone"
            :class="{ 'p-invalid': errorTimezone }"
            v-model="timezone"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Timezone of the user.</small
          >
        </div>
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <label
            for="language"
            class="text-color text-base font-medium"
            >Language</label
          >
          <Dropdown
            appendTo="self"
            id="language"
            :options="optionsLanguage"
            optionLabel="label"
            optionValue="value"
            :class="{ 'p-invalid': errorLanguage }"
            v-model="language"
            disabled
          >
            <small class="text-xs text-color-secondary font-normal leading-5">
              Sets the Azion Console language for the user.</small
            >
            <template #dropdownicon>
              <span class="pi pi-lock text-color-secondary" />
            </template>
          </Dropdown>
        </div>
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Contact Information"
    description="Modify the contact information for the account."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="email"
          class="text-color text-base font-medium"
          >Email *</label
        >
        <InputText
          v-model="email"
          id="email"
          type="email"
          autocomplete="off"
          placeholder="example@email.com"
          :class="{ 'p-invalid': errorEmail }"
        />
        <small class="text-xs text-color-secondary font-normal leading-5">
          Email of the user.</small
        >
        <small
          id="name-help"
          class="p-error"
        >
          {{ errorEmail }}
        </small>
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="mobile"
          class="text-color text-base font-medium"
          >Phone Number *</label
        >
        <div class="flex gap-2">
          <div class="p-inputgroup">
            <Dropdown
              filter
              autoFilterFocus
              appendTo="self"
              id="countryCallCode"
              :options="filteredCountriesMobile"
              optionLabel="labelFormat"
              :loading="isLoadingCountry"
              :disabled="isLoadingCountry"
              :class="{ 'p-invalid': errorCountryCallCode }"
              class="w-2/3 surface-border border-r-0"
              v-model="selectedCountryCallCode"
              :pt="{
                filterInput: {
                  class: 'w-full'
                }
              }"
            >
              <template #option="{ option }">
                {{ option.label }}
              </template>
            </Dropdown>

            <InputMask
              date="phone"
              v-model="mobile"
              class="w-full"
              :disabled="isLoadingCountry"
              mask="?99999999999999999999"
              placeholder="5500999999999"
              :class="{ 'p-invalid': errorMobile }"
            />
          </div>
        </div>
        <small class="text-xs text-color-secondary font-normal leading-5">
          The phone number of the user. Include country and region code.
        </small>
        <small
          id="name-help"
          class="p-error"
        >
          {{ errorMobile }}
        </small>
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Security Settings"
    description="Modify password and confirm the password to save the new settings. Account Owners can enable or disable MFA for the account."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="oldPassword"
          class="text-color text-base font-medium"
          >Old Password *</label
        >
        <InputPassword
          toggleMask
          v-model="oldPassword"
          id="oldPassword"
          class="w-full"
          autocomplete="new-password"
          :inputProps="{ autocomplete: 'new-password' }"
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
          >New Password *</label
        >
        <InputPassword
          toggleMask
          v-model="password"
          id="password"
          autocomplete="new-password"
          class="w-full"
          :class="{ 'p-invalid': errorPassword }"
          @input="validation()"
          :feedback="false"
        />
        <small class="p-error text-xs font-normal leading-tight">{{ errorPassword }}</small>

        <label class="font-semibold text-sm my-2">Must have at least:</label>
        <ul class="text-color-secondary list-inside space-y-3">
          <li
            class="flex gap-3 items-center text-color-secondary"
            v-for="(requirement, index) in passwordRequirementsList"
            :key="index"
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
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="confirmPassword"
          class="text-color text-base font-medium"
          >Confirm Password *</label
        >
        <InputPassword
          toggleMask
          v-model="confirmPassword"
          id="confirmPassword"
          class="w-full"
          autocomplete="off"
          :class="{ 'p-invalid': errorConfirmPassword }"
          :feedback="false"
        />
        <small
          id="name-help"
          class="p-error"
          >{{ errorConfirmPassword }}</small
        >
      </div>
      <FieldSwitchBlock
        nameField="twoFactorEnabled"
        name="twoFactorEnabled"
        auto
        :readonly="isForceMFA"
        :isCard="false"
        title="Multi-Factor Authentication"
        subtitle="Multi-factor authentication adds an extra layer of security to your account. In addition to your username and password, you will need an application like Google Authenticator on your phone to get verification codes when prompted. Enabling multi-factor authentication, you MUST set up an account on Google Authenticator on your next login."
      />
    </template>
  </FormHorizontal>
</template>
