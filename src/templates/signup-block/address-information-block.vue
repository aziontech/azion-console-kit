<template>
  <div class="border border-default border-solid rounded-md bg-surface">
    <div class="flex items-center justify-between px-6 py-3 border-b border-default">
      <span class="text-lg font-semibold text-default">Address Information</span>
    </div>

    <div class="flex w-full max-w-full flex-col gap-8 p-6">
      <div class="flex w-full flex-col gap-6 md:flex-row">
        <div class="flex w-full min-w-0 flex-1 flex-col gap-2">
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

        <div class="flex w-full min-w-0 flex-1 flex-col gap-2">
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

      <div class="flex w-full flex-col gap-6 md:flex-row">
        <div class="flex w-full min-w-0 flex-1 flex-col gap-2">
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

        <div class="flex w-full min-w-0 flex-1 flex-col gap-2">
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

      <div class="flex w-full min-w-0 flex-col gap-2">
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

      <div class="flex w-full min-w-0 flex-col gap-2">
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
  import { useAccountStore } from '@/stores/account'
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

  const emit = defineEmits(['readiness-change'])

  const toast = useToast()
  const accountStore = useAccountStore()

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

  const { value: country } = useField('country')
  const { value: postalCode } = useField('postalCode')
  const { value: region } = useField('region')
  const { value: city } = useField('city')
  const { value: address } = useField('address')
  const { value: complement } = useField('complement')

  const countriesOptions = ref({ options: [], done: true })
  const regionsOptions = ref({ options: [], done: true })
  const citiesOptions = ref({ options: [], done: true })
  const isApplyingInitialValues = ref(false)

  const isAddressFormReady = () => {
    return Boolean(
      String(postalCode.value || '').trim() &&
        String(country.value || '').trim() &&
        String(region.value || '').trim() &&
        String(city.value || '').trim() &&
        String(address.value || '').trim()
    )
  }

  const emitReadinessChange = () => {
    emit('readiness-change', isAddressFormReady())
  }

  onMounted(async () => {
    await setCountriesOptions()
    await setInitialValues()
    emitReadinessChange()
  })

  const setInitialValues = async () => {
    const initialAddress = accountStore.accountData || {}
    const initialValues = {
      postalCode: initialAddress.postalCode || initialAddress.postal_code || '',
      country: initialAddress.country || '',
      region: initialAddress.region || '',
      city: initialAddress.city || '',
      address: initialAddress.address || '',
      complement: initialAddress.complement || ''
    }

    const hasAddressInfo = Object.values(initialValues).some((value) => !!value)
    if (!hasAddressInfo) return

    isApplyingInitialValues.value = true
    try {
      resetForm({ values: initialValues })

      if (initialValues.country) {
        await setRegionsOptions(initialValues.country, { resetSelection: false })
      }

      if (initialValues.region) {
        await setCitiesOptions(initialValues.region, { resetSelection: false })
      }
    } finally {
      isApplyingInitialValues.value = false
    }
  }

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

  const setRegionsOptions = async (countryId, { resetSelection = true } = {}) => {
    regionsOptions.value.done = false
    regionsOptions.value.options = []
    citiesOptions.value.options = []

    if (resetSelection) {
      region.value = ''
      city.value = ''
    }

    if (!countryId) {
      regionsOptions.value.done = true
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

  const setCitiesOptions = async (regionId, { resetSelection = true } = {}) => {
    citiesOptions.value.done = false

    if (resetSelection) {
      city.value = ''
    }

    if (!regionId) {
      citiesOptions.value.options = []
      citiesOptions.value.done = true
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

  const handleCountryChange = (event) => {
    country.value = event.value
  }

  const handleRegionChange = (event) => {
    region.value = event.value
  }

  watch(country, (countryId) => {
    if (isApplyingInitialValues.value) return

    if (!countryId) {
      regionsOptions.value.options = []
      citiesOptions.value.options = []
      region.value = ''
      city.value = ''
      emitReadinessChange()
      return
    }

    if (countryId) setRegionsOptions(countryId)
    emitReadinessChange()
  })

  watch(region, (regionId) => {
    if (isApplyingInitialValues.value) return

    if (!regionId) {
      citiesOptions.value.options = []
      city.value = ''
      emitReadinessChange()
      return
    }

    if (regionId) setCitiesOptions(regionId)
    emitReadinessChange()
  })

  watch([postalCode, city, address, country, region], () => {
    emitReadinessChange()
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
    accountStore.setAccountData(payload)
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
