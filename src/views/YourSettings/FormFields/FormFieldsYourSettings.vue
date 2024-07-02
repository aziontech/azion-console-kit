<script setup>
  import { useField } from 'vee-validate'
  import { computed, onMounted, ref, watch } from 'vue'

  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import Dropdown from 'primevue/dropdown'
  import InputMask from 'primevue/inputmask'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import InputPassword from 'primevue/password'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'
  import LabelBlock from '@/templates/label-block'

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
  const { value: language } = useField('language')
  const { value: email } = useField('email')
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
    data-testid="your-settings-form__section__profile"
    title="Profile"
    description="Modify the personal information of the account."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          data-testid="your-settings-form__first-name"
          label="First Name"
          required
          name="firstName"
          :value="firstName"
          description="The first name of the user."
        />
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          data-testid="your-settings-form__last-name"
          label="Last Name"
          required
          name="lastName"
          :value="lastName"
          description="The last name of the user."
        />
      </div>
      <div class="flex sm:flex-row w-full flex-col gap-6">
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <FieldDropdown
            data-testid="your-settings-form__timezone"
            label="Timezone"
            required
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
        <div
          class="flex flex-col w-full sm:max-w-xs gap-2"
          data-testid="your-settings-form__language"
        >
          <LabelBlock
            data-testid="your-settings-form__language__label"
            for="language"
            label="Language"
          />
          <Dropdown
            data-testid="your-settings-form__language__dropdown"
            appendTo="self"
            id="language"
            :options="optionsLanguage"
            optionLabel="label"
            optionValue="value"
            name="language"
            v-model="language"
            disabled
          >
            <small
              class="text-xs text-color-secondary font-normal leading-5"
              data-testid="your-settings-form__language__description"
            >
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
    data-testid="your-settings-form__contact"
    title="Contact Information"
    description="Modify the contact information for the account."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          data-testid="your-settings-form__email"
          label="Email"
          required
          name="email"
          :value="email"
          type="email"
          autocomplete="off"
          placeholder="example@email.com"
          description="Email of the user."
        />
      </div>

      <div
        class="flex flex-col sm:max-w-lg w-full gap-2"
        data-testid="your-settings-form__mobile"
      >
        <LabelBlock
          data-testid="your-settings-form__mobile__label"
          for="mobile"
          label="Phone Number"
          isRequired
        />
        <div class="flex gap-2">
          <div class="p-inputgroup">
            <Dropdown
              data-testid="your-settings-form__country-code__dropdown"
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
              data-testid="your-settings-form__mobile__input"
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
        <small
          class="text-xs text-color-secondary font-normal leading-5"
          data-testid="your-settings-form__mobile__description"
        >
          The phone number of the user. Include country and region code.
        </small>
        <small
          data-testid="your-settings-form__mobile__error-message"
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
    data-testid="your-settings-form__section__security"
  >
    <template #inputs>
      <div
        class="flex flex-col sm:max-w-lg w-full gap-2"
        data-testid="your-settings-form__old-password"
      >
        <LabelBlock
          data-testid="your-settings-form__old-password__label"
          for="oldPassword"
          label="Old Password"
          isRequired
        />
        <InputPassword
          data-testid="your-settings-form__old-password__input"
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
          data-testid="your-settings-form__old-password__error-message"
          id="name-help"
          class="p-error"
        >
          {{ errorOldPassword }}
        </small>
      </div>
      <div
        class="flex flex-col sm:max-w-lg gap-2"
        data-testid="your-settings-form__new-password"
      >
        <LabelBlock
          data-testid="your-settings-form__new-password__label"
          for="password"
          label="New Password"
          isRequired
        />
        <InputPassword
          data-testid="your-settings-form__new-password__input"
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
        <small
          class="p-error text-xs font-normal leading-tight"
          data-testid="your-settings-form__new-password__error-message"
        >
          {{ errorPassword }}
        </small>

        <label
          class="font-semibold text-sm my-2"
          data-testid="your-settings-form__new-password__requirement-label"
          >Must have at least:</label
        >
        <ul
          class="text-color-secondary list-inside space-y-3"
          data-testid="your-settings-form__new-password__requirement-list"
        >
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
      <div
        class="flex flex-col sm:max-w-lg w-full gap-2"
        data-testid="your-settings-form__confirm-password"
      >
        <LabelBlock
          data-testid="your-settings-form__confirm-password__label"
          for="confirmPassword"
          label="Confirm Password"
          isRequired
        />
        <InputPassword
          data-testid="your-settings-form__confirm-password__input"
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
          data-testid="your-settings-form__confirm-password__error-message"
          id="name-help"
          class="p-error"
        >
          {{ errorConfirmPassword }}
        </small>
      </div>
      <FieldSwitchBlock
        data-testid="your-settings-form__enforce-mfa"
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
