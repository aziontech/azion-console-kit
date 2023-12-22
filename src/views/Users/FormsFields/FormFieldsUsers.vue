<script setup>
  import { ref, onMounted } from 'vue'
  import { useField } from 'vee-validate'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'

  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import InputText from 'primevue/inputtext'
  import Dropdown from 'primevue/dropdown'
  import Divider from 'primevue/divider'
  import InputSwitch from 'primevue/inputswitch'
  import MultiSelect from 'primevue/multiselect'
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

  const fetchCountries = async () => {
    const countries = await props.listCountriesPhoneService()
    setCountries(countries)
    setCountryCallCodeBasedOnFormType()
  }
  const setCountries = (countries) => {
    optionsCountriesMobile.value = countries
    filteredCountriesMobile.value = [...countries]
  }
  const setCountryCallCodeBasedOnFormType = () => {
    if (props.isEditForm) {
      setCountryCallCodeForEditForm()
    } else {
      setCountryCallCodeForNewForm()
    }
  }
  const setCountryCallCodeForNewForm = () => {
    countryCallCode.value = optionsCountriesMobile.value[0]
  }
  const setCountryCallCodeForEditForm = () => {
    countryCallCode.value = filteredCountriesMobile.value.find(
      (country) => country.value === countryCallCode.value
    )
  }

  const fetchTimezone = async () => {
    const result = await props.listTimezonesService()
    optionsTimezone.value = result.listTimeZones

    if (!props.isEditForm) {
      timezone.value = result.defaultSelected
    }
  }
  const fetchDetailAccount = async () => {
    const account = await props.loadAccountDetailsService()
    isForceMFA.value = account?.is_enabled_mfa_to_all_users

    if (!props.isEditForm) {
      twoFactorEnabled.value = isForceMFA.value
    }
  }
  const fetchTeams = async () => {
    const result = await props.listTeamsService()
    optionsTeams.value = result
    if (!props.isEditForm) teamsIds.value = [result[0].value]
  }
  onMounted(async () => {
    await fetchCountries()
    await fetchTimezone()
    await fetchTeams()
    await fetchDetailAccount()
  })

  const handleisAccountOwner = () => {
    if (!isAccountOwner.value) {
      teamsIds.value = []
    }
  }

  accountIsOwner.value = account?.is_account_owner
  isAccountOwner.value = accountIsOwner.value
</script>
<template>
  <FormHorizontal title="General">
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
          >Last Name *</label
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
            for="timezone"
            class="text-color text-base font-medium"
            >Timezone *</label
          >
          <Dropdown
            id="timezone"
            filter
            :options="optionsTimezone"
            optionLabel="label"
            optionValue="value"
            placeholder="Loading..."
            :loading="!timezone"
            :class="{ 'p-invalid': errorTimezone }"
            v-model="timezone"
          />
        </div>
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <label
            for="language"
            class="text-color text-base font-medium"
            >Language</label
          >
          <Dropdown
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

  <FormHorizontal title="Contact information">
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
              id="countryCallCode"
              filter
              :options="filteredCountriesMobile"
              optionLabel="labelFormat"
              placeholder="Loading..."
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
              placeholder="999999999999"
              :class="{ 'p-invalid': errorMobile || !countryCallCode }"
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

  <FormHorizontal title="Security Settings"
  description="Determine the level of access and permissions of the user or enable Multi-Factor Authentication upon sign-in.">
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
        <small class="text-xs text-color-secondary font-normal leading-tight">
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
              Account owners can add all the users and have all permissions enabled.
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
              Accounts that have MFA enabled can enforce mobile client authentication upon login.
            </small>
          </template>
        </Card>
      </div>
    </template>
  </FormHorizontal>
</template>
