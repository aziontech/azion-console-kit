<template>
  <FormHorizontal title="Main Settings">
    <template #inputs>
      <div class="flex flex-col w-full gap-2 sm:max-w-lg">
        <FieldText
          :value="accountName"
          name="accountName"
          placeholder="Your Account Name"
          :label="'Account Name'"
          :required="true"
          data-testid="reseller-form__company-name"
        />
      </div>
      <div class="flex flex-col w-full gap-2 sm:max-w-lg">
        <FieldText
          :value="companyName"
          placeholder="Company S.A."
          name="companyName"
          :label="'Company Name'"
          :required="true"
          data-testid="reseller-form__company-name"
        />
      </div>
      <div class="flex flex-col w-full gap-2 sm:max-w-lg">
        <FieldText
          :value="uniqueIdentifier"
          name="uniqueIdentifier"
          placeholder="00.000.000/0001-00"
          :label="'Unique Identifier'"
          data-testid="reseller-form__company-name"
        />
      </div>
      <div class="w-full flex flex-col gap-2">
        <FieldSwitchBlock
          data-testid="reseller-form__active-field"
          nameField="active"
          name="active"
          auto
          :isCard="false"
          title="Active"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal title="Address Information">
    <template #inputs>
      <div class="flex flex-col w-full gap-2 sm:max-w-lg">
        <FieldDropdown
          label="Country"
          required
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
          data-testid="reseller-form__country"
        />
      </div>
      <div class="flex flex-col w-full gap-2 sm:max-w-lg">
        <FieldDropdown
          label="State/Region"
          required
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
          data-testid="reseller-form__region"
        />
      </div>
      <div class="flex flex-col w-full gap-2 sm:max-w-lg">
        <FieldDropdown
          label="City"
          required
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
          data-testid="reseller-form__city"
        />
      </div>
      <div class="flex flex-col w-full gap-2 sm:max-w-lg">
        <FieldText
          label="Address"
          required
          name="address"
          placeholder="123 Example Ave."
          :value="address"
          description="Account owner's street address."
          data-testid="reseller-form__address"
        />
      </div>
      <div class="flex flex-col w-full gap-2 sm:max-w-lg">
        <FieldText
          label="Apartment, floor, etc."
          name="complement"
          placeholder="1st floor"
          :value="complement"
          description="Additional information for the address."
          data-testid="reseller-form__complement"
        />
      </div>
      <div class="flex flex-col w-full gap-2 sm:max-w-lg">
        <FieldText
          data-testid="reseller-form__postal-code"
          label="Postal Code"
          required
          name="postalCode"
          placeholder="00.000.000-00"
          :value="postalCode"
          description="Postal code of the account owner."
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Account Owner"
    description="Information about Account Owner"
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-2 sm:max-w-lg">
        <FieldText
          :value="firstName"
          name="firstName"
          :label="'First Name'"
          :required="true"
          data-testid="reseller-form__company-name"
        />
      </div>
      <div class="flex flex-col w-full gap-2 sm:max-w-lg">
        <FieldText
          :value="lastName"
          name="lastName"
          :label="'Last Name'"
          :required="true"
          data-testid="reseller-form__company-name"
        />
      </div>
      <div class="flex flex-col w-full gap-2 sm:max-w-lg">
        <FieldText
          :value="email"
          name="email"
          :label="'Email Identifier'"
          :required="true"
          data-testid="reseller-form__company-name"
        />
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'

  defineOptions({ name: 'form-fields-create-resellers' })

  import { useToast } from 'primevue/usetoast'
  import { useField } from 'vee-validate'
  import { onMounted, ref, watch, computed } from 'vue'

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

  const toast = useToast()
  const showToast = (summary, severity) => {
    const options = {
      severity,
      summary,
      closable: true
    }

    return toast.add(options)
  }

  const countriesOptions = ref({ options: [], done: true })
  const regionsOptions = ref({ options: [], done: true })
  const citiesOptions = ref({ options: [], done: true })

  const { value: accountName } = useField('accountName')
  const { value: companyName } = useField('companyName')
  const { value: uniqueIdentifier } = useField('uniqueIdentifier')
  const { value: active } = useField('active')
  const { value: country } = useField('country')
  const { value: region } = useField('region')
  const { value: city } = useField('city')
  const { value: address } = useField('address')
  const { value: complement } = useField('complement')
  const { value: postalCode } = useField('postalCode')

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

  const resetRegionAndCity = () => {
    region.value = ''
    city.value = ''
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

  const hasNoCountryListOrNotSelected = computed(
    () => !countriesOptions.value.options.length || !country.value
  )
  const hasNoRegionListOrNotSelected = computed(
    () => !citiesOptions.value.options.length || !region.value
  )

  onMounted(() => {
    setCountriesOptions()
  })
</script>
