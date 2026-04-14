<template>
  <div class="border border-default border-solid rounded-md bg-surface">
    <div class="flex items-center justify-between px-6 py-3 border-b border-default">
      <span class="text-lg font-semibold text-default">Address Information</span>
    </div>

    <div class="flex flex-col gap-8 p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div class="flex flex-col gap-2 w-full">
          <FieldDropdown
            name="country"
            label="Country"
            required
            :value="country"
            :options="countriesOptions.options"
            :loading="!countriesOptions.done"
            optionLabel="name"
            optionValue="geonameId"
            placeholder="Select a Country"
            appendTo="self"
            filter
            class="w-full"
            @change="handleCountryChange"
          />
        </div>

        <div class="flex flex-col gap-2 w-full">
          <FieldInput
            name="postalCode"
            label="Postal Code"
            required
            :value="postalCode"
            placeholder="00.000.000-00"
            class="w-full"
            @input="postalCode = $event"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div class="flex flex-col gap-2 w-full">
          <FieldDropdown
            name="region"
            label="State/Region"
            required
            :value="region"
            :options="regionsOptions.options"
            :loading="!regionsOptions.done"
            optionLabel="name"
            optionValue="geonameId"
            placeholder="Select a State/Region"
            appendTo="self"
            filter
            :disabled="!country"
            class="w-full"
            @change="handleRegionChange"
          />
        </div>

        <div class="flex flex-col gap-2 w-full">
          <FieldDropdown
            name="city"
            label="City"
            required
            :value="city"
            :options="citiesOptions.options"
            :loading="!citiesOptions.done"
            optionLabel="name"
            optionValue="geonameId"
            placeholder="Select a City"
            appendTo="self"
            filter
            :disabled="!region"
            class="w-full"
            @change="city = $event.value"
          />
        </div>
      </div>

      <div class="flex flex-col gap-2 w-full">
        <FieldInput
          name="address"
          label="Address"
          required
          :value="address"
          placeholder="123 Example Ave."
          class="w-full"
          @input="address = $event"
        />
      </div>

      <div class="flex flex-col gap-2 w-full">
        <FieldInput
          name="complement"
          label="Apartment, floor, etc."
          :value="complement"
          placeholder="1st floor"
          class="w-full"
          @input="complement = $event"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
  import { onMounted, ref, watch } from 'vue'
  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'
  import { useToast } from '@aziontech/webkit/use-toast'
  import FieldInput from '@aziontech/webkit/field-text'
  import FieldDropdown from '@aziontech/webkit/field-dropdown'
  import {
    listCountriesService,
    listRegionsService,
    listCitiesService
  } from '@/services/account-settings-services'
  import { updateAddressService } from '@/services/signup-services'

  defineOptions({
    name: 'address-information-block'
  })

  const toast = useToast()

  const addressSchema = yup.object({
    postalCode: yup.string().required().label('Postal Code'),
    country: yup.string().required().label('Country'),
    region: yup.string().required().label('State/Region'),
    city: yup.string().required().label('City'),
    address: yup.string().required().label('Address'),
    complement: yup.string()
  })

  const { validate } = useForm({
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

  const { value: country } = useField('country')
  const { value: postalCode } = useField('postalCode')
  const { value: region } = useField('region')
  const { value: city } = useField('city')
  const { value: address } = useField('address')
  const { value: complement } = useField('complement')

  const countriesOptions = ref({ options: [], done: true })
  const regionsOptions = ref({ options: [], done: true })
  const citiesOptions = ref({ options: [], done: true })

  onMounted(() => {
    setCountriesOptions()
  })

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
    citiesOptions.value.options = []
    region.value = ''
    city.value = ''
    if (!countryId) return
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
    city.value = ''
    if (!regionId) return
    try {
      const response = await listCitiesService(regionId)
      citiesOptions.value.options = response
    } catch (error) {
      showToast(error, 'error')
    } finally {
      citiesOptions.value.done = true
    }
  }

  const handleCountryChange = (event) => {
    country.value = event.value
  }

  const handleRegionChange = (event) => {
    region.value = event.value
  }

  watch(country, (countryId) => {
    if (countryId) setRegionsOptions(countryId)
  })

  watch(region, (regionId) => {
    if (regionId) setCitiesOptions(regionId)
  })

  const saveAddress = async () => {
    const { valid } = await validate()
    if (!valid) return false

    const payload = {
      postalCode: postalCode.value,
      country: country.value,
      region: region.value,
      city: city.value,
      address: address.value,
      complement: complement.value
    }

    await updateAddressService(payload)
    return payload
  }

  const getCountry = (countryGeonameId) => {
    return (
      countriesOptions.value.options.find((opt) => opt.geonameId === countryGeonameId)?.name || ''
    )
  }

  defineExpose({ saveAddress, getCountry })
</script>

<style scoped>
  :deep(.text-base) {
    font-size: 12px !important;
  }
</style>
