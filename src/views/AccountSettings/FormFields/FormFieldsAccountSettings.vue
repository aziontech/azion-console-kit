<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldTextArea from '@/templates/form-fields-inputs/fieldTextArea'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'
  import FieldGroupSwitch from '@/templates/form-fields-inputs/fieldGroupSwitch.vue'
  import InputText from 'primevue/inputtext'
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

  const { value: accountName } = useField('accountName')
  const { value: clientId } = useField('clientId')
  const { value: companyName } = useField('companyName')
  const { value: uniqueIdentifier } = useField('uniqueIdentifier')
  const { value: billingEmails } = useField('billingEmails')
  const { value: postalCode } = useField('postalCode')
  const { value: country } = useField('country')
  const { value: region } = useField('region')
  const { value: city } = useField('city')
  const { value: address } = useField('address')
  const { value: complement } = useField('complement')

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

  const switchOptions = computed(() => [
    {
      title: 'Allow Social Login',
      nameField: 'isSocialLoginEnabled',
      subtitle:
        'When enabled, users linked to the account can log in using their social network credentials.'
    },
    {
      title: 'Enforce Multi-Factor Authentication',
      nameField: 'isEnabledMfaToAllUsers',
      subtitle:
        'When enabled, MFA will be enforced upon login for all users linked to this account.'
    }
  ])

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
        <FieldText
          label="Account Name *"
          name="accountName"
          placeholder="Company"
          :value="accountName"
        />
      </div>
      <div class="flex flex-col w-full sm:max-w-lg gap-2">
        <label
          for="clientId"
          class="text-color text-base font-medium leading-5"
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
        <FieldText
          label="Company Name"
          name="companyName"
          placeholder="Company S.A."
          :value="companyName"
          description="Name of the company associated with the account."
        />
      </div>
      <div class="flex flex-col w-full gap-2 sm:max-w-lg">
        <FieldText
          label="Company ID"
          name="uniqueIdentifier"
          placeholder="00.000.000/0001-00"
          :value="uniqueIdentifier"
          description="Personal or company ID number to identify account ownership."
        />
      </div>
      <div class="flex flex-col w-full gap-2 sm:max-w-lg">
        <FieldTextArea
          label="Billing Emails"
          placeholder="example@email.com;holder@email.com"
          name="billingEmails"
          :value="billingEmails"
          description="Billing information will be forwarded to all emails listed in this field. Separate each
          email address with a semicolon ( ; )."
        />
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
          <FieldText
            label="Postal Code *"
            name="postalCode"
            placeholder="00.000.000-00"
            :value="postalCode"
            description="Postal code of the account owner."
          />
        </div>
        <div class="flex flex-col w-full gap-2 sm:max-w-lg">
          <FieldDropdown
            label="Country *"
            name="country"
            :options="countriesOptions.options"
            :loading="!countriesOptions.done"
            @change="resetRegionAndCity"
            optionValue="geonameId"
            optionLabel="name"
            :value="country"
            filter
            appendTo="self"
            description="Account owner's country."
          />
        </div>
      </div>
      <div class="flex flex-col gap-6 md:gap-8 md:flex-row">
        <div class="flex flex-col w-full gap-2 sm:max-w-lg">
          <FieldDropdown
            label="State/Region *"
            name="region"
            :options="regionsOptions.options"
            :loading="!regionsOptions.done"
            optionValue="geonameId"
            optionLabel="name"
            :value="region"
            filter
            appendTo="self"
            :disabled="hasNoCountryListOrNotSelected"
            description="Account owner's state or region."
          />
        </div>
        <div class="flex flex-col w-full gap-2 sm:max-w-lg">
          <FieldDropdown
            label="City *"
            name="city"
            :options="citiesOptions.options"
            :loading="!citiesOptions.done"
            optionValue="geonameId"
            optionLabel="name"
            :value="city"
            filter
            appendTo="self"
            :disabled="hasNoRegionListOrNotSelected"
            description="Account owner's city."
          />
        </div>
      </div>
      <div class="flex flex-col gap-6 md:gap-8 md:flex-row">
        <div class="flex flex-col w-full gap-2 sm:max-w-lg">
          <FieldText
            label="Address *"
            name="address"
            placeholder="123 Example Ave."
            :value="address"
            description="Account owner's street address."
          />
        </div>
        <div class="flex flex-col w-full gap-2 sm:max-w-lg">
          <FieldText
            label="Apartment, floor, etc."
            name="complement"
            placeholder="1st floor"
            :value="complement"
            description="Additional information for the address."
          />
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
        <FieldGroupSwitch
          :isCard="false"
          input-class="w-full"
          :options="switchOptions"
        />
      </div>
    </template>
  </FormHorizontal>
</template>
