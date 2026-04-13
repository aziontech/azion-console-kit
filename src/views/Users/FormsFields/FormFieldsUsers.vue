<script setup>
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'
  import { useField } from 'vee-validate'
  import { computed, ref, watch } from 'vue'
  import FieldText from '@aziontech/webkit/field-text'
  import FieldDropdown from '@aziontech/webkit/field-dropdown'
  import FieldPhoneNumber from '@aziontech/webkit/field-phone-number'
  import LabelBlock from '@aziontech/webkit/label'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import Dropdown from '@aziontech/webkit/dropdown'
  import FieldSwitchBlock from '@aziontech/webkit/field-switch-block'
  import MultiSelect from '@aziontech/webkit/multiselect'
  import FieldGroupSwitch from '@aziontech/webkit/field-group-switch'

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
    },
    resetForm: {
      type: Function
    },
    isEditForm: {
      type: Boolean,
      default: false
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
  const loadingCountry = ref(true)
  const isInitializing = ref(false)

  const { value: firstName } = useField('firstName')
  const { value: lastName } = useField('lastName')
  const { value: timezone } = useField('timezone')
  const { value: language } = useField('language')
  const { value: email } = useField('email')
  const { value: countryCallCode } = useField('countryCallCode')
  const { value: isAccountOwner } = useField('isAccountOwner')
  const { value: teamsIds, errorMessage: errorTeamsIds } = useField('teamsIds')

  const disabledUserTeams = computed(() => isAccountOwner.value || !optionsTeams.value.length)

  const setCountriesOptions = (countries) => {
    optionsCountriesMobile.value = countries
    filteredCountriesMobile.value = [...countries]
  }

  const fetchCountries = async () => {
    const countries = await props.listCountriesPhoneService()
    setCountriesOptions(countries)
    const firstCountry = optionsCountriesMobile.value[0].value

    if (props.isEditForm) {
      const userCountry = setCountryCallCodeForEditForm()
      if (userCountry) {
        countryCallCode.value = userCountry
      }
      loadingCountry.value = false
      return
    }

    return firstCountry
  }

  const setCountryCallCodeForEditForm = () => {
    const currentValue = countryCallCode.value
    if (!currentValue) return undefined

    const exactMatch = filteredCountriesMobile.value.find(
      (country) => country.value === currentValue
    )
    if (exactMatch) return exactMatch.value

    return filteredCountriesMobile.value.find((country) =>
      country.value.endsWith(` - ${currentValue}`)
    )?.value
  }

  const fetchTimezone = async () => {
    const result = await props.listTimezonesService()
    optionsTimezone.value = result.listTimeZones

    if (!props.isEditForm) {
      return result.defaultSelected
    }
  }
  const fetchDetailAccount = async () => {
    const account = await props.loadAccountDetailsService()
    isForceMFA.value = account?.data?.is_enabled_mfa_to_all_users

    if (!props.isEditForm) {
      return !!isForceMFA.value
    }
  }
  const fetchTeams = async () => {
    const result = await props.listTeamsService()
    optionsTeams.value = result

    if (!props.isEditForm) {
      const firstTeamId = result[0].value
      return firstTeamId
    }
  }

  const initializeFormValues = async () => {
    accountIsOwner.value = account?.is_account_owner
    isAccountOwner.value = accountIsOwner.value
    isInitializing.value = true

    const defaultTeamId = await fetchTeams()
    const initialCountry = await fetchCountries()
    const initialTimezone = await fetchTimezone()
    const forceMfaEnabled = await fetchDetailAccount()

    if (!props.isEditForm) {
      const initialValues = {
        firstName: firstName.value,
        lastName: lastName.value,
        timezone: initialTimezone,
        language: language.value || 'en',
        email: email.value,
        countryCallCode: initialCountry,
        mobile: '',
        isAccountOwner: accountIsOwner.value,
        teamsIds: [defaultTeamId],
        twoFactorEnabled: forceMfaEnabled,
        isActive: true
      }
      props.resetForm({ values: initialValues })
      loadingCountry.value = false
    }

    isInitializing.value = false
  }

  const switchOptions = computed(() => [
    {
      title: 'Account owner',
      nameField: 'isAccountOwner',
      readonly: accountIsOwner.value,
      disabled: accountIsOwner.value,
      subtitle:
        'Account owner: Full access to all features, including account and solution management. Non-owner: Restricted access to solution management, based on Teams permissions.'
    },
    {
      title: 'Enforce Multi-Factor Authentication',
      nameField: 'twoFactorEnabled',
      readonly: isForceMFA.value,
      disabled: isForceMFA.value,
      subtitle:
        'The Account Owner can enable or disable the enforce MFA functionality. MFA will be mandatory for all users of this account when enabling this item.'
    }
  ])

  watch(isAccountOwner, (newValue) => {
    if (newValue && !isInitializing.value) {
      teamsIds.value = []
    }
  })

  watch(countryCallCode, (newValue) => {
    if (loadingCountry.value || !filteredCountriesMobile.value.length || !newValue) return

    const hasMatch = filteredCountriesMobile.value.some((country) => country.value === newValue)
    if (!hasMatch) {
      const matched = setCountryCallCodeForEditForm()
      if (matched) {
        countryCallCode.value = matched
      }
    }
  })

  initializeFormValues()
</script>

<template>
  <FormHorizontal
    title="Profile"
    description="Provide personal information to add a new user to Azion Console."
    data-testid="users-form__section__profile"
  >
    <template #inputs>
      <FieldText
        label="First Name"
        required
        name="firstName"
        placeholder="John"
        :value="firstName"
        description="The first name of the user."
        data-testid="users-form__first-name-field"
      />
      <FieldText
        label="Last Name"
        required
        name="lastName"
        placeholder="Doe"
        :value="lastName"
        description="The last name of the user."
        data-testid="users-form__last-name-field"
      />
      <div class="flex sm:flex-row w-full flex-col gap-6">
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <FieldDropdown
            label="Timezone"
            required
            name="timezone"
            :options="optionsTimezone"
            :loading="!timezone && !optionsTimezone.length"
            :disabled="!timezone && !optionsTimezone.length"
            optionLabel="label"
            optionValue="value"
            :value="timezone"
            filter
            appendTo="self"
            description="Timezone of the user."
            data-testid="users-form__timezone-field"
          />
        </div>
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <LabelBlock
            label="Language"
            data-testid="users-form__language-field__label"
          />
          <Dropdown
            appendTo="self"
            id="language"
            name="language"
            :options="optionsLanguage"
            optionLabel="label"
            optionValue="value"
            v-model="language"
            disabled
            data-testid="users-form__language-field__dropdown"
          >
            <template #dropdownicon>
              <span
                class="pi pi-lock text-color-secondary"
                data-testid="users-form__language-field__dropdown__icon"
              />
            </template>
          </Dropdown>
        </div>
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Contact Information"
    description="Include contact information for the user to verify the account."
    data-testid="users-form__section__contact-information"
  >
    <template #inputs>
      <FieldText
        label="Email"
        required
        name="email"
        placeholder="example@email.com"
        :value="email"
        description="Email of the user. A confirmation email will be sent to this address upon sign up."
        type="email"
        data-testid="users-form__email-field"
      />

      <FieldPhoneNumber
        :options="filteredCountriesMobile"
        :loading="loadingCountry"
        label="Phone Number"
        description="The phone number of the user. Include country and region code."
        data-testid="users-form__phone-field"
      />
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Security Settings"
    description="Determine the level of access and permissions of the user and enable Multi-Factor Authentication upon sign-in."
    data-testid="users-form__section__security-settings"
  >
    <template #inputs>
      <div class="flex flex-col w-full sm:max-w-3xl gap-2">
        <label
          for="teams"
          class="text-color text-base font-medium"
          data-testid="users-form__teams-field__label"
        >
          Teams
        </label>
        <MultiSelect
          :pt="{
            root: {
              'data-testid': 'users-form__teams-field__multiselect'
            },
            trigger: {
              'data-testid': 'users-form__teams-field__multiselect-trigger'
            },
            filterInput: {
              'data-testid': 'users-form__teams-field__multiselect-filter'
            }
          }"
          display="chip"
          filter
          autoFilterFocus
          id="teams"
          :disabled="disabledUserTeams"
          :loading="!optionsTeams.length"
          :options="optionsTeams"
          optionLabel="label"
          optionValue="value"
          placeholder="No option selected"
          :maxSelectedLabels="5"
          :class="{ 'p-invalid': errorTeamsIds }"
          v-model="teamsIds"
          name="teamsIds"
        />
        <small
          v-if="errorTeamsIds"
          class="p-error"
          data-testid="users-form__teams-field__error-message"
          >{{ errorTeamsIds }}</small
        >
        <small
          class="text-xs text-color-secondary font-normal leading-5"
          data-testid="users-form__teams-field__description"
        >
          Select a team for the user. You can create teams using Teams Permissions.</small
        >
      </div>
      <FieldGroupSwitch
        data-testid="users-form__mfa-field"
        :isCard="false"
        input-class="w-full"
        :options="switchOptions"
      />
    </template>
  </FormHorizontal>
  <form-horizontal title="Status">
    <template #inputs>
      <FieldSwitchBlock
        data-testid="user-form__active-field"
        nameField="isActive"
        name="isActive"
        auto
        :isCard="false"
        title="Active"
      />
    </template>
  </form-horizontal>
</template>
