<script setup>
  import { useField } from 'vee-validate'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import InputText from 'primevue/inputtext'
  import TextArea from 'primevue/textarea'
  import InputSwitch from 'primevue/inputswitch'
  import Dropdown from 'primevue/dropdown'
  import Divider from 'primevue/divider'
  import { onMounted, ref, watch } from 'vue'
  import { useToast } from 'primevue/usetoast'

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
    return toast.add({
      severity,
      summary,
      closable: true
    })
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

  const setRegionsOptions = async (geonameId) => {
    regionsOptions.value.done = false
    try {
      const response = await props.listRegionsService(geonameId)
      regionsOptions.value.options = response
    } catch (error) {
      showToast(error, 'error')
    } finally {
      regionsOptions.value.done = true
    }
  }

  const setCitiesOptions = async (geonameId) => {
    citiesOptions.value.done = false
    try {
      const response = await props.listCitiesService(geonameId)
      citiesOptions.value.options = response
    } catch (error) {
      showToast(error, 'error')
    } finally {
      citiesOptions.value.done = true
    }
  }

  watch(country, (value) => {
    setRegionsOptions(value)
  })

  watch(region, (value) => {
    if (value) {
      setCitiesOptions(value)
    }
  })

  const resetRegionAndCity = () => {
    region.value = ''
    city.value = ''
  }
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
        <small class="text-color-secondary text-xs font-normal leading-tight">
          Name of the account.
        </small>
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
        <small class="text-color-secondary text-xs font-normal leading-tight">
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
        <small class="text-color-secondary text-xs font-normal leading-tight">
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
        <small class="text-color-secondary text-xs font-normal leading-tight">
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
        <small class="text-color-secondary text-sm font-normal leading-tight">
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
          <small class="text-color-secondary text-sm font-normal leading-tight">
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
          <small class="text-color-secondary text-sm font-normal leading-tight">
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
            id="region"
            filter
            optionValue="geonameId"
            optionLabel="name"
            :options="regionsOptions.options"
            v-model="region"
            :loading="!regionsOptions.done"
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
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
            id="city"
            filter
            optionValue="geonameId"
            optionLabel="name"
            :options="citiesOptions.options"
            v-model="city"
            :class="{ 'p-invalid': cityError }"
            :loading="!citiesOptions.done"
          />
          <small class="text-color-secondary text-sm font-normal leading-tight">
            City of the account owner.
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
          <small class="text-color-secondary text-sm font-normal leading-tight">
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
          <small class="text-color-secondary text-sm font-normal leading-tight">
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
              When enabled, users linked to the account can login to RTM using their social network
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
