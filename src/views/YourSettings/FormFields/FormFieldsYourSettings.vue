<script setup>
  import { useField } from 'vee-validate'
  import { ref } from 'vue'

  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import Dropdown from '@aziontech/webkit/dropdown'
  import FieldText from '@aziontech/webkit/field-text'
  import FieldSwitchBlock from '@aziontech/webkit/field-switch-block'
  import FieldPhoneNumberCountry from '@aziontech/webkit/field-phone-number-country'
  import FieldPassword from '@aziontech/webkit/field-password'
  import FieldDropdown from '@aziontech/webkit/field-dropdown'
  import LabelBlock from '@aziontech/webkit/label'

  const emit = defineEmits(['password-strength'])

  defineProps({
    timezoneOptions: {
      type: Array,
      required: true
    },
    listCountriesPhoneService: {
      type: Function,
      required: true
    }
  })

  const isForceMFA = ref(false)
  const optionsLanguage = ref([{ label: 'English', value: 'en' }])

  const { value: firstName } = useField('firstName')
  const { value: lastName } = useField('lastName')
  const { value: timezone } = useField('timezone')
  const { value: language } = useField('language')
  const { value: email } = useField('email')

  const passwordRequirementsList = ref([
    { label: '8 characters', key: 'minLength', valid: false },
    { label: '1 uppercase letter', key: 'uppercase', valid: false },
    { label: '1 lowercase letter', key: 'lowercase', valid: false },
    { label: '1 number', key: 'number', valid: false },
    { label: '1 special character (example: !?<>@#$%)', key: 'specialChar', valid: false }
  ])

  const onPasswordStrength = (strength) => {
    passwordRequirementsList.value[0].valid = strength.minLength
    passwordRequirementsList.value[1].valid = strength.uppercase
    passwordRequirementsList.value[2].valid = strength.lowercase
    passwordRequirementsList.value[3].valid = strength.number
    passwordRequirementsList.value[4].valid = strength.specialChar
    emit('password-strength', strength)
  }
</script>

<template>
  <FormHorizontal
    data-testid="your-settings-form__section__profile"
    title="Profile"
    description="Modify the personal information of the account."
  >
    <template #inputs>
      <FieldText
        data-testid="your-settings-form__first-name"
        label="First Name"
        required
        name="firstName"
        :value="firstName"
        description="The first name of the user."
      />
      <FieldText
        data-testid="your-settings-form__last-name"
        label="Last Name"
        required
        name="lastName"
        :value="lastName"
        description="The last name of the user."
      />
      <div class="flex sm:flex-row w-full flex-col gap-6">
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <FieldDropdown
            data-testid="your-settings-form__timezone"
            label="Timezone"
            required
            name="timezone"
            :options="timezoneOptions"
            :loading="!timezone || !timezoneOptions.length"
            :disabled="!timezoneOptions.length"
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
      <FieldPhoneNumberCountry
        :listCountriesPhoneService="listCountriesPhoneService"
        label="Phone Number"
        description="The phone number of the user. Include country and region code."
        data-testid="your-settings-form__phone"
      />
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Security Settings"
    description="Modify password and confirm the password to save the new settings. Account Owners can enable or disable MFA for the account."
    data-testid="your-settings-form__section__security"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldPassword
          data-testid="your-settings-form__old-password"
          name="oldPassword"
          label="Old Password"
          required
        />
      </div>
      <div
        class="flex flex-col sm:max-w-lg gap-2"
        data-testid="your-settings-form__new-password"
      >
        <FieldPassword
          data-testid="your-settings-form__new-password__input"
          name="password"
          label="New Password"
          required
          @strength="onPasswordStrength"
        />

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
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldPassword
          data-testid="your-settings-form__confirm-password"
          name="confirmPassword"
          label="Confirm Password"
          required
        />
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
