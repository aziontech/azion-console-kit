<template>
  <FormHorizontal
    :isDrawer="true"
    title="Address Information"
    description="Insert address information for the account."
  >
    <template #inputs>
      <div
        data-sentry-mask
        class="flex flex-col gap-6 md:gap-8 md:flex-row"
      >
        <div class="flex flex-col w-full gap-2 sm:max-w-lg">
          <FieldText
            data-testid="account-settings__postal-code"
            label="Postal Code"
            required
            name="postalCode"
            placeholder="00.000.000-00"
            :value="postalCode"
            description="Postal code of the account owner."
          />
        </div>
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
            data-testid="account-settings__country"
          />
        </div>
      </div>
      <div
        data-sentry-mask
        class="flex flex-col gap-6 md:gap-8 md:flex-row"
      >
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
            data-testid="account-settings__region"
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
            data-testid="account-settings__city"
          />
        </div>
      </div>
      <div
        data-sentry-mask
        class="flex flex-col gap-6 md:gap-8 md:flex-row"
      >
        <div class="flex flex-col w-full gap-2 sm:max-w-lg">
          <FieldText
            label="Address"
            required
            name="address"
            placeholder="123 Example Ave."
            :value="address"
            description="Account owner's street address."
            data-testid="account-settings__address"
          />
        </div>
        <div class="flex flex-col w-full gap-2 sm:max-w-lg">
          <FieldText
            label="Apartment, floor, etc."
            name="complement"
            placeholder="1st floor"
            :value="complement"
            description="Additional information for the address."
            data-testid="account-settings__complement"
          />
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import FieldText from '@/templates/form-fields-inputs/fieldText.vue'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown.vue'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import { useToast } from 'primevue/usetoast'
  import { onMounted, ref, watch, computed } from 'vue'
  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'
  import {
    listCitiesService,
    listCountriesService,
    listRegionsService
  } from '@/services/account-settings-services'
  import { updateAccountSettingsService } from '@/services/account-settings-services/update-account-settings-address-service'
  import { getAccountSettingsService } from '@/services/account-settings-services/get-account-settings-service'

  const toast = useToast()

  const addressSchema = yup.object({
    postalCode: yup.string().required().label('Postal Code'),
    country: yup.string().required().label('Country'),
    region: yup.string().required().label('State/Region'),
    city: yup.string().required().label('City'),
    address: yup.string().required().label('Address'),
    complement: yup.string()
  })

  const { validate, resetForm } = useForm({
    validationSchema: addressSchema,
    initialValues: {
      postalCode: '',
      country: '',
      region: '',
      city: '',
      address: '',
      complement: ''
    }
  })

  const { value: postalCode } = useField('postalCode')
  const { value: country } = useField('country')
  const { value: region } = useField('region')
  const { value: city } = useField('city')
  const { value: address } = useField('address')
  const { value: complement } = useField('complement')

  const countriesOptions = ref({ options: [], done: true })
  const regionsOptions = ref({ options: [], done: true })
  const citiesOptions = ref({ options: [], done: true })

  onMounted(() => {
    setCountriesOptions()
    setInitialValues()
  })

  const setInitialValues = async () => {
    const data = await getAccountSettingsService()
    if (!data) return
    resetForm({
      values: {
        postalCode: data?.postalCode,
        country: data?.country,
        region: data?.region,
        city: data?.city,
        address: data?.address,
        complement: data?.complement
      }
    })
  }

  const saveAddress = async () => {
    const { valid } = await validate()
    if (!valid) {
      return false
    }

    const payload = {
      postalCode: postalCode.value,
      country: country.value,
      region: region.value,
      city: city.value,
      address: address.value,
      complement: complement.value
    }
    return await updateAccountSettingsService(payload)
  }

  const getCountry = (country) => {
    return countriesOptions?.value.options?.find((opts) => opts?.geonameId === country)?.name
  }

  defineExpose({ saveAddress, getCountry })

  const showToast = (summary, severity) => {
    const options = {
      severity,
      summary,
      closable: true
    }

    return toast.add(options)
  }

  const setCountriesOptions = async () => {
    countriesOptions.value.done = false
    try {
      const response = await listCountriesService()
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
      const response = await listRegionsService(countryId)
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
      const response = await listCitiesService(regionId)
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

  const hasNoCountryListOrNotSelected = computed(
    () => !countriesOptions.value.options.length || !country.value
  )
  const hasNoRegionListOrNotSelected = computed(
    () => !citiesOptions.value.options.length || !region.value
  )

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
</script>
