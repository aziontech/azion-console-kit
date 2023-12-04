<!-- eslint-disable vue/no-mutating-props -->
<script setup>
  import { ref, onMounted } from 'vue'
  import { useField } from 'vee-validate'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'

  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import InputText from 'primevue/inputtext'
  import AutoComplete from 'primevue/autocomplete'
  import Dropdown from 'primevue/dropdown'
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
  const { value: selectedTimezone, errorMessage: errorSelectedTimezone } =
    useField('selectedTimezone')
  const { value: selectedLanguage, errorMessage: errorSelectedLanguage } =
    useField('selectedLanguage')
  const { value: email, errorMessage: errorEmail } = useField('email')
  const { value: selectedCountry, errorMessage: errorSelectedCountry } = useField('selectedCountry')
  const { value: mobile, errorMessage: errorMobile } = useField('mobile')
  const { value: userIsOwner, errorMessage: errorUserIsOwner } = useField('userIsOwner')
  const { value: selectedTeam, errorMessage: errorSelectedTeam } = useField('selectedTeam')
  const { value: twoFactorEnabled, errorMessage: errorTwoFactorEnabled } =
    useField('twoFactorEnabled')

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
<template>
  <FormHorizontal title="General">
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="name"
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
          for="name"
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
        />
      </div>
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
          <AutoComplete
            :suggestions="filteredCountriesMobile"
            optionLabel="labelFormat"
            dropdown
            :loading="!optionsCountriesMobile.length"
            :class="{ 'p-invalid': errorSelectedCountry }"
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
            :class="{ 'p-invalid': errorMobile && !selectedCountry }"
          />
        </div>
        <small
          id="name-help"
          class="p-error"
          >{{ errorMobile }}</small
        >
      </div>

      <Card
        :pt="{
          root: { class: 'shadow-none  rounded-none' },
          body: { class: 'py-4 border-0' },
          title: { class: 'flex items-center text-base m-0 gap-3 font-medium' },
          subtitle: {
            class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
          }
        }"
      >
        <template #title>
          <InputSwitch
            :class="{ 'p-invalid': errorUserIsOwner }"
            :disabled="accountIsOwner"
            :readonly="accountIsOwner"
            v-model="userIsOwner"
            @click="handleUserIsOwner"
          />
          <div class="flex-col gap-1">
            <div class="">
              <div class="text-color text-sm font-normal">Account owner</div>
            </div>
          </div>
        </template>
      </Card>

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
          :disabled="userIsOwner"
          :loading="!optionsTeams.length"
          :options="optionsTeams"
          optionLabel="label"
          optionValue="value"
          placeholder="Nothing selected"
          :maxSelectedLabels="5"
          :class="{ 'p-invalid': errorSelectedTeam }"
          v-model="selectedTeam"
        />
      </div>
      <Card
        :pt="{
          root: { class: 'shadow-none  rounded-none' },
          body: { class: 'py-4 border-0' },
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
          />
          <div class="flex-col gap-1">
            <div class="">
              <div class="text-color text-sm font-normal">Multi-Factor Authentication</div>
            </div>
          </div>
        </template>
      </Card>
    </template>
  </FormHorizontal>
</template>
