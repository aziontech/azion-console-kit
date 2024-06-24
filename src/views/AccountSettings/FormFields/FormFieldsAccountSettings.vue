<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import Divider from 'primevue/divider'
  import Dropdown from 'primevue/dropdown'
  import InputSwitch from 'primevue/inputswitch'
  import InputText from 'primevue/inputtext'
  import TextArea from 'primevue/textarea'
  import { useToast } from 'primevue/usetoast'
  import { useField } from 'vee-validate'
  import { onMounted, ref, watch, computed } from 'vue'
  import { TOAST_LIFE } from '@/utils/constants'

  const props = defineProps({
    listCountriesService: {
      type: Function,
      required: true
    },
    listRegionsService: {
      type: Function,
      required: true
    },
    listCitiesService: {
      type: Function,
      required: true
    }
  })

  const { value: accountName, errorMessage: accountNameError } = useField('accountName')
  const { value: clientId } = useField('clientId')
  const { value: companyName } = useField('companyName')
  const { value: uniqueIdentifier } = useField('uniqueIdentifier')
  const { value: billingEmails } = useField('billingEmails')
  const { value: postalCode, errorMessage: postalCodeError } = useField('postalCode')
  const { value: country, errorMessage: countryError } = useField('country')
  const { value: region, errorMessage: regionError } = useField('region')
  const { value: city, errorMessage: cityError } = useField('city')
  const { value: address, errorMessage: addressError } = useField('address')
  const { value: complement } = useField('complement')
  const { value: isSocialLoginEnabled } = useField('isSocialLoginEnabled')
  const { value: isEnabledMfaToAllUsers } = useField('isEnabledMfaToAllUsers')

  const countriesOptions = ref({ options: [], done: true })
  const regionsOptions = ref({ options: [], done: true })
  const citiesOptions = ref({ options: [], done: true })

  const toast = useToast()
  const showToast = (summary, severity) => {
    const options = {
      severity,
      summary,
      closable: true
    }

    if (severity === 'success') {
      options.life = TOAST_LIFE
    }

    return toast.add(options)
  }
  const setCountriesOptions = async () => {
    countriesOptions.value.done = false
    try {
      const response = await props.listCountriesService()
      countriesOptions.value.options = response
    } catch (error) {
      showToast(error, 'error')
    } finally {
      countriesOptions.value.done = true
    }
  }

  onMounted(() => {
    setCountriesOptions()
  })

  const setRegionsOptions = async (countryId) => {
    regionsOptions.value.done = false
    if (!countryId) {
      return
    }
    try {
      const response = await props.listRegionsService(countryId)
      regionsOptions.value.options = response
    } catch (error) {
      showToast(error, 'error')
    } finally {
      regionsOptions.value.done = true
    }
  }

  const setCitiesOptions = async (regionId) => {
    citiesOptions.value.done = false
    if (!regionId) {
      return
    }
    try {
      const response = await props.listCitiesService(regionId)
      citiesOptions.value.options = response
    } catch (error) {
      showToast(error, 'error')
    } finally {
      citiesOptions.value.done = true
    }
  }

  watch(
    [country, countriesOptions.value],
    (value) => {
      const countryId = value[0]

      if (countryId && countriesOptions.value.options.length) {
        setRegionsOptions(countryId)
      }
    },
    { deep: true }
  )

  watch(
    [region, regionsOptions.value],
    (value) => {
      const regionId = value[0]

      if (regionId && regionsOptions.value.options.length) {
        setCitiesOptions(regionId)
      }
    },
    { deep: true }
  )

  const resetRegionAndCity = () => {
    region.value = ''
    city.value = ''
  }

  const hasNoCountryListOrNotSelected = computed(
    () => !countriesOptions.value.options.length || !country.value
  )
  const hasNoRegionListOrNotSelected = computed(
    () => !citiesOptions.value.options.length || !region.value
  )
</script>

<template>
  <FormHorizontal
    title="General"
    description="Modify account name and check your ID."
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-2 sm:max-w-lg">
        <label
          for="accountName"
          class="text-color text-base font-medium"
        >
          Account Name *
        </label>
        <InputText
          v-model="accountName"
          id="accountName"
          type="text"
          :class="{ 'p-invalid': accountNameError }"
          placeholder="Company"
        />
        <small
          v-if="accountNameError"
          class="p-error text-xs font-normal leading-tight"
        >
          {{ accountNameError }}
        </small>
      </div>

      <div class="flex flex-col w-full sm:max-w-lg gap-2">
        <label
          for="clientId"
          class="text-color text-base font-medium"
        >
          Client ID
        </label>
        <span class="p-input-icon-right">
          <i class="pi pi-lock text-[var(--text-color-secondary)]" />
          <InputText
            v-model="clientId"
            id="clientId"
            type="text"
            class="w-full"
            readonly
          />
        </span>
        <small class="text-xs text-color-secondary font-normal leading-5">
          ID of the associated account. Can't be changed. Use this value to open support tickets for
          issues related to the account.
        </small>
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Company Information"
    description="Add data on the company associated with the account."
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-2 sm:max-w-lg">
        <label
          for="companyName"
          class="text-color text-base font-medium"
        >
          Company Name
        </label>
        <InputText
          v-model="companyName"
          id="companyName"
          type="text"
          placeholder="Company S.A."
        />
        <small class="text-xs text-color-secondary font-normal leading-5">
          Name of the company associated with the account.
        </small>
      </div>
      <div class="flex flex-col w-full gap-2 sm:max-w-lg">
        <label
          for="uniqueIdentifier"
          class="text-color text-base font-medium"
        >
          Company ID
        </label>
        <InputText
          v-model="uniqueIdentifier"
          id="uniqueIdentifier"
          type="text"
          placeholder="00.000.000/0001-00"
        />
        <small class="text-xs text-color-secondary font-normal leading-5">
          Personal or company ID number to identify account ownership.
        </small>
      </div>
      <div class="flex flex-col w-full gap-2 sm:max-w-lg">
        <label
          for="billingEmails"
          class="text-color text-base font-medium"
        >
          Billing Emails
        </label>
        <TextArea
          id="billingEmails"
          v-model="billingEmails"
          rows="5"
          cols="30"
          placeholder="example@email.com;holder@email.com"
        />
        <small class="text-xs text-color-secondary font-normal leading-5">
          Billing information will be forwarded to all emails listed in this field. Separate each
          email address with a semicolon (<code>;</code>).
        </small>
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Address Information"
    description="Insert address information for the account."
  >
    <template #inputs>
      <div class="flex flex-col gap-6 md:gap-8 md:flex-row">
        <div class="flex flex-col w-full gap-2 sm:max-w-lg">
          <label
            for="postalCode"
            class="text-color text-base font-medium"
          >
            Postal Code *
          </label>
          <InputText
            v-model="postalCode"
            id="postalCode"
            type="text"
            :class="{ 'p-invalid': postalCodeError }"
            placeholder="00.000.000-00"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Postal code of the account owner.
          </small>
          <small
            v-if="postalCodeError"
            class="p-error text-xs font-normal leading-tight"
          >
            {{ postalCodeError }}
          </small>
        </div>
        <div class="flex flex-col w-full gap-2 sm:max-w-lg">
          <label
            for="country"
            class="text-color text-base font-medium"
          >
            Country *
          </label>
          <Dropdown
            autoFilterFocus
            appendTo="self"
            id="country"
            filter
            optionValue="geonameId"
            optionLabel="name"
            :options="countriesOptions.options"
            v-model="country"
            :class="{ 'p-invalid': countryError }"
            :loading="!countriesOptions.done"
            @change="resetRegionAndCity"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Account owner's country.
          </small>
          <small
            v-if="countryError"
            class="p-error text-xs font-normal leading-tight"
          >
            {{ countryError }}
          </small>
        </div>
      </div>
      <div class="flex flex-col gap-6 md:gap-8 md:flex-row">
        <div class="flex flex-col w-full gap-2 sm:max-w-lg">
          <label
            for="region"
            class="text-color text-base font-medium"
          >
            State/Region *
          </label>
          <Dropdown
            autoFilterFocus
            appendTo="self"
            id="region"
            filter
            optionValue="geonameId"
            optionLabel="name"
            :options="regionsOptions.options"
            v-model="region"
            :loading="!regionsOptions.done"
            :disabled="hasNoCountryListOrNotSelected"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Account owner's state or region.
          </small>
          <small
            v-if="regionError"
            class="p-error text-xs font-normal leading-tight"
          >
            {{ regionError }}
          </small>
        </div>
        <div class="flex flex-col w-full gap-2 sm:max-w-lg">
          <label
            for="city"
            class="text-color text-base font-medium"
          >
            City *
          </label>
          <Dropdown
            autoFilterFocus
            appendTo="self"
            id="city"
            filter
            optionValue="geonameId"
            optionLabel="name"
            :options="citiesOptions.options"
            v-model="city"
            :class="{ 'p-invalid': cityError }"
            :loading="!citiesOptions.done"
            :disabled="hasNoRegionListOrNotSelected"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Account owner's city.
          </small>
          <small
            v-if="cityError"
            class="p-error text-xs font-normal leading-tight"
          >
            {{ cityError }}
          </small>
        </div>
      </div>
      <div class="flex flex-col gap-6 md:gap-8 md:flex-row">
        <div class="flex flex-col w-full gap-2 sm:max-w-lg">
          <label
            for="address"
            class="text-color text-base font-medium"
          >
            Address *
          </label>
          <InputText
            v-model="address"
            id="address"
            type="text"
            :class="{ 'p-invalid': addressError }"
            placeholder="123 Example Ave."
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Account owner's street address.
          </small>
          <small
            v-if="addressError"
            class="p-error text-xs font-normal leading-tight"
          >
            {{ addressError }}
          </small>
        </div>
        <div class="flex flex-col w-full gap-2 sm:max-w-lg">
          <label
            for="complement"
            class="text-color text-base font-medium"
          >
            Apartment, floor, etc.
          </label>
          <InputText
            v-model="complement"
            id="complement"
            type="text"
            placeholder="1st floor"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Additional information for the address.
          </small>
        </div>
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Login Settings"
    description="Activate Social Login or Multi-Factor Authentication (MFA) to secure user verification to access the account."
  >
    <template #inputs>
      <div class="w-full flex flex-col gap-2">
        <div class="w-full flex flex-col gap-2 pt-2 pb-3">
          <div class="flex gap-1">
            <InputSwitch
              v-model="isSocialLoginEnabled"
              inputId="isSocialLoginEnabled"
            />
            <label
              class="text-color text-sm font-normal leading-5"
              for="isSocialLoginEnabled"
            >
              Allow Social Login
            </label>
          </div>
          <div class="flex-col gap-1 pl-10">
            <p class="text-color-secondary text-sm font-normal">
              When enabled, users linked to the account can log in using their social network
              credentials.
            </p>
          </div>
        </div>
        <Divider />
        <div class="w-full flex flex-col gap-2 pt-2 pb-3">
          <div class="flex gap-1">
            <InputSwitch
              v-model="isEnabledMfaToAllUsers"
              inputId="isEnabledMfaToAllUsers"
            />
            <label
              class="text-color text-sm font-normal leading-5"
              for="isEnabledMfaToAllUsers"
            >
              Enforce Multi-Factor Authentication
            </label>
          </div>
          <div class="flex-col gap-1 pl-10">
            <p class="text-color-secondary text-sm font-normal">
              When enabled, MFA will be enforced upon login for all users linked to this account.
            </p>
          </div>
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>
