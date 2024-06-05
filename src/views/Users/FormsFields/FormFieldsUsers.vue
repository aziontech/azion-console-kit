<script setup>
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'
  import { useField } from 'vee-validate'
  import { ref } from 'vue'

  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import Card from 'primevue/card'
  import Divider from 'primevue/divider'
  import Dropdown from 'primevue/dropdown'
  import InputMask from 'primevue/inputmask'
  import InputSwitch from 'primevue/inputswitch'
  import InputText from 'primevue/inputtext'
  import MultiSelect from 'primevue/multiselect'

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

  const { value: firstName, errorMessage: errorFirstName } = useField('firstName')
  const { value: lastName, errorMessage: errorLastName } = useField('lastName')
  const { value: timezone, errorMessage: errorTimezone } = useField('timezone')
  const { value: language, errorMessage: errorLanguage } = useField('language')
  const { value: email, errorMessage: errorEmail } = useField('email')
  const { value: countryCallCode, errorMessage: errorCountryCallCode } = useField('countryCallCode')
  const { value: mobile, errorMessage: errorMobile } = useField('mobile')
  const { value: isAccountOwner, errorMessage: errorisAccountOwner } = useField('isAccountOwner')
  const { value: teamsIds, errorMessage: errorTeamsIds } = useField('teamsIds')
  const { value: twoFactorEnabled, errorMessage: errorTwoFactorEnabled } =
    useField('twoFactorEnabled')

  const setCountriesOptions = (countries) => {
    optionsCountriesMobile.value = countries
    filteredCountriesMobile.value = [...countries]
  }

  const fetchCountries = async () => {
    const countries = await props.listCountriesPhoneService()
    setCountriesOptions(countries)

    if (props.isEditForm) {
      setCountryCallCodeForEditForm()
    } else {
      const firstCountry = optionsCountriesMobile.value[0].value
      return firstCountry
    }

    return
  }

  const setCountryCallCodeForEditForm = () => {
    const loadedCountryCallCode = filteredCountriesMobile.value.find(
      (country) => country.value === countryCallCode.value
    )
    countryCallCode.value = loadedCountryCallCode.value
  }

  const fetchTimezone = async () => {
    const result = await props.listTimezonesService()
    optionsTimezone.value = result.listTimeZones

    if (!props.isEditForm) {
      return result.defaultSelected
    }
    return
  }
  const fetchDetailAccount = async () => {
    const account = await props.loadAccountDetailsService()
    isForceMFA.value = account?.data?.is_enabled_mfa_to_all_users

    if (!props.isEditForm) {
      return !!isForceMFA.value
    }
    return
  }
  const fetchTeams = async () => {
    const result = await props.listTeamsService()
    optionsTeams.value = result

    if (!props.isEditForm) {
      const firstTeamId = result[0].value
      return firstTeamId
    }

    return
  }
  const initializeFormValues = async () => {
    accountIsOwner.value = account?.is_account_owner
    isAccountOwner.value = accountIsOwner.value

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
        mobile: mobile.value,
        isAccountOwner: accountIsOwner.value,
        teamsIds: [defaultTeamId],
        twoFactorEnabled: forceMfaEnabled
      }

      props.resetForm({ values: initialValues })
    }
  }

  const handleisAccountOwner = () => {
    if (!isAccountOwner.value) {
      teamsIds.value = []
    }
  }

  initializeFormValues()
</script>

<template>
  <FormHorizontal
    title="Profile"
    description="Provide personal information to add a new user to Azion Console."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="firstName"
          class="text-color text-base font-medium"
          >First Name *</label
        >
        <InputText
          v-model="firstName"
          id="firstName"
          type="text"
          :class="{ 'p-invalid': errorFirstName }"
          placeholder="John"
        />
        <small
          id="name-help"
          class="p-error"
          >{{ errorFirstName }}</small
        >
        <small class="text-xs text-color-secondary font-normal leading-5">
          The first name of the user.
        </small>
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="lastName"
          class="text-color text-base font-medium"
          >Last Name *</label
        >
        <InputText
          v-model="lastName"
          id="lastName"
          type="text"
          :class="{ 'p-invalid': errorLastName }"
          placeholder="Doe"
        />
        <small
          id="name-help"
          class="p-error"
          >{{ errorLastName }}</small
        >
        <small class="text-xs text-color-secondary font-normal leading-5">
          The last name of the user.
        </small>
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
            Timezone of the user.
          </small>
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
    description="Include contact information for the user to verify the account."
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
          placeholder="example@email.com"
          :class="{ 'p-invalid': errorEmail }"
        />
        <small class="text-xs text-color-secondary font-normal leading-5">
          Email of the user. A confirmation email will be sent to this address upon sign up.
        </small>
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
              placeholder="Loading..."
              optionValue="value"
              :loading="!filteredCountriesMobile.length"
              :class="{ 'p-invalid': errorCountryCallCode }"
              class="surface-border border-r-0 w-1/4"
              v-model="countryCallCode"
            >
              <template #option="{ option }">
                {{ option.label }}
              </template>
            </Dropdown>
            <InputMask
              date="phone"
              v-model="mobile"
              class="w-full"
              mask="?99999999999999999999"
              placeholder="5500999999999"
              :class="{ 'p-invalid': errorMobile || !countryCallCode }"
            />
          </div>
        </div>
        <small
          id="name-help"
          class="p-error"
          >{{ errorMobile }}</small
        >
        <small class="text-xs text-color-secondary font-normal leading-5">
          The phone number of the user. Include country and region code.
        </small>
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Security Settings"
    description="Determine the level of access and permissions of the user and enable Multi-Factor Authentication upon sign-in."
  >
    <template #inputs>
      <div class="flex flex-col w-full sm:max-w-3xl gap-2">
        <label
          for="teams"
          class="text-color text-base font-medium"
          >Teams</label
        >
        <MultiSelect
          display="chip"
          filter
          id="teams"
          :disabled="isAccountOwner"
          :loading="!optionsTeams.length"
          :options="optionsTeams"
          optionLabel="label"
          optionValue="value"
          placeholder="No option selected"
          :maxSelectedLabels="5"
          :class="{ 'p-invalid': errorTeamsIds }"
          v-model="teamsIds"
        />
        <small class="text-xs text-color-secondary font-normal leading-5">
          Select a team for the user. You can create teams using Teams Permissions.</small
        >
      </div>
      <div>
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
              :class="{ 'p-invalid': errorisAccountOwner }"
              :disabled="accountIsOwner"
              :readonly="accountIsOwner"
              v-model="isAccountOwner"
              @click="handleisAccountOwner"
              inputId="accountOwner"
            />
            <div class="flex-col gap-1">
              <label
                for="accountOwner"
                class="text-color text-sm font-normal"
                >Account Owner</label
              >
            </div>
          </template>

          <template #content>
            <small class="text-color-secondary text-sm">
              Account owners can add new users and have all permissions enabled.
            </small>
          </template>
        </Card>

        <Divider></Divider>

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
              :disabled="isForceMFA"
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
              Accounts with MFA enabled will require additional client authentication upon login.
            </small>
          </template>
        </Card>
      </div>
    </template>
  </FormHorizontal>
</template>
