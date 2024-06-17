<script setup>
  import { useField } from 'vee-validate'
  import { computed, onMounted, ref, watch } from 'vue'

  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import Card from 'primevue/card'
  import Dropdown from 'primevue/dropdown'
  import InputMask from 'primevue/inputmask'
  import InputSwitch from 'primevue/inputswitch'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import InputPassword from 'primevue/password'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'

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

  const { value: firstName } = useField('firstName')
  const { value: lastName } = useField('lastName')
  const { value: timezone } = useField('timezone')
  const { value: language, errorMessage: errorLanguage } = useField('language')
  const { value: email } = useField('email')
  const { value: countryCallCode, errorMessage: errorCountryCallCode } = useField('countryCallCode')
  const { value: mobile, errorMessage: errorMobile } = useField('mobile')
  const { value: twoFactorEnabled, errorMessage: errorTwoFactorEnabled } =
    useField('twoFactorEnabled')
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
        <FieldText
          label="First Name *"
          name="firstName"
          :value="firstName"
          description="The first name of the user."
        />
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Last Name *"
          name="lastName"
          :value="lastName"
          description="The last name of the user."
        />
      </div>
      <div class="flex sm:flex-row w-full flex-col gap-6">
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <FieldDropdown
            label="Timezone *"
            name="timezone"
            :options="optionsTimezone"
            :loading="!timezone || !optionsTimezone.length"
            :disabled="!optionsTimezone.length"
            optionLabel="label"
            optionValue="value"
            :value="timezone"
            filter
            appendTo="self"
            description="Timezone of the user."
          />
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
            name="language"
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
        <FieldText
          label="Email *"
          name="email"
          :value="email"
          type="email"
          autocomplete="off"
          placeholder="example@email.com"
          description="Email of the user."
        />
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
              name="countryCallCode"
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
              name="mobile"
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
        >
          Old Password *
        </label>
        <InputPassword
          toggleMask
          v-model="oldPassword"
          id="oldPassword"
          class="w-full"
          autocomplete="new-password"
          :inputProps="{ autocomplete: 'new-password' }"
          :feedback="false"
          :pt="{
            input: {
              name: 'oldPassword'
            }
          }"
        />
        <small
          id="name-help"
          class="p-error"
        >
          {{ errorOldPassword }}
        </small>
      </div>
      <div class="flex flex-col sm:max-w-lg gap-2">
        <label
          for="password"
          class="font-semibold text-sm"
        >
          New Password *
        </label>
        <InputPassword
          toggleMask
          v-model="password"
          id="password"
          autocomplete="new-password"
          class="w-full"
          :pt="{
            input: {
              name: 'password'
            }
          }"
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
        >
          Confirm Password *
        </label>
        <InputPassword
          toggleMask
          v-model="confirmPassword"
          id="confirmPassword"
          class="w-full"
          autocomplete="off"
          :class="{ 'p-invalid': errorConfirmPassword }"
          :feedback="false"
          :pt="{
            input: {
              name: 'confirmPassword'
            }
          }"
        />
        <small
          id="name-help"
          class="p-error"
        >
          {{ errorConfirmPassword }}
        </small>
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
            >
              Multi-Factor Authentication
            </label>
          </div>
        </template>

        <template #content>
          <small class="text-color-secondary text-sm">
            Accounts with MFA enabled can enforce mobile client authentication upon login.
          </small>
        </template>
      </Card>
    </template>
  </FormHorizontal>
</template>
