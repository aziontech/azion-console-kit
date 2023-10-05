<template>
  <div>
    <Toast />
    <CreateFormBlockWithEvent
      :pageTitle="TEXT_CONSTANTS.title"
      :createService="props.updateAccountSettingsService"
      :formData="values"
      :isValid="meta.valid"
      :cleanFormCallback="resetForm"
      @on-response="handleResponse"
      :isRequestSuccess="false"
    >
      <template #form>
        <h6 class="text-lg font-bold">{{ TEXT_CONSTANTS.sections.accountProfile }}</h6>
        <div class="flex flex-col gap-2">
          <label for="id">{{ TEXT_CONSTANTS.id.label }}</label>
          <p id="id">Test id</p>
        </div>
        <div class="flex flex-col gap-2">
          <label for="name">{{ TEXT_CONSTANTS.accountName.label }}</label>
          <InputText
            v-model="name"
            id="name"
            type="text"
            :class="{ 'p-invalid': errors.name }"
            v-tooltip.top="errors.name"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="companyName">{{ TEXT_CONSTANTS.companyName.label }}</label>
          <InputText
            v-model="companyName"
            id="companyName"
            type="text"
          />
          <small>{{ TEXT_CONSTANTS.companyName.tipText }}</small>
        </div>
        <div class="flex flex-col gap-2">
          <label for="companySize">{{ TEXT_CONSTANTS.companySize.label }}</label>
          <InputText
            v-model="companySize"
            id="companySize"
            type="text"
            disabled
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="uniqueIdentifier">{{ TEXT_CONSTANTS.uniqueIdentifier.label }}</label>
          <InputText
            v-model="uniqueIdentifier"
            id="uniqueIdentifier"
            type="text"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="billingEmails">{{ TEXT_CONSTANTS.billingEmails.label }}</label>
          <InputText
            v-model="billingEmails"
            id="billingEmails"
            type="text"
          />
          <small>{{ TEXT_CONSTANTS.billingEmails.tipText }}</small>
        </div>
        <h6 class="text-lg font-bold">{{ TEXT_CONSTANTS.sections.addressInformation }}</h6>
        <div class="flex flex-col gap-2">
          <label for="country">{{ TEXT_CONSTANTS.country.label }}</label>
          <Dropdown
            id="country"
            optionLabel="name"
            optionValue="id"
            :options="countriesOptions"
            :class="{ 'p-invalid': errors.country }"
            v-model="country"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="stateRegion">{{ TEXT_CONSTANTS.stateRegion.label }}</label>
          <Dropdown
            id="stateRegion"
            optionLabel="name"
            optionValue="id"
            :options="regionsOptions"
            :class="{ 'p-invalid': errors.stateRegion }"
            v-model="stateRegion"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="city">{{ TEXT_CONSTANTS.city.label }}</label>
          <Dropdown
            id="city"
            optionLabel="name"
            optionValue="id"
            :options="citiesOptions"
            :class="{ 'p-invalid': errors.city }"
            v-model="city"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="address">{{ TEXT_CONSTANTS.address.label }}</label>
          <InputText
            v-model="address"
            id="address"
            type="text"
            :class="{ 'p-invalid': errors.address }"
            v-tooltip.top="errors.address"
          />
          <InputText
            v-model="complement"
            id="complement"
            type="text"
            :placeholder="TEXT_CONSTANTS.address.complementPlaceholder"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="postalCode">{{ TEXT_CONSTANTS.postalCode.label }}</label>
          <InputText
            v-model="postalCode"
            id="postalCode"
            type="text"
            :class="{ 'p-invalid': errors.postalCode }"
            v-tooltip.top="errors.postalCode"
          />
        </div>
        <h6 class="text-lg font-bold">{{ TEXT_CONSTANTS.sections.authenticationSettings }}</h6>
        <div class="flex flex-col gap-2">
          <div class="flex gap-3 items-center">
            <label for="socialLogin">{{ TEXT_CONSTANTS.socialLogin.label }}</label>
            <InputSwitch
              id="socialLogin"
              v-model="socialLogin"
            />
          </div>
          <small>{{ TEXT_CONSTANTS.socialLogin.tipText }}</small>
        </div>
        <div class="flex flex-col gap-2">
          <div class="flex gap-3 items-center">
            <label for="enforceMfa">{{ TEXT_CONSTANTS.enforceMFA.label }}</label>
            <InputSwitch
              id="enforceMfa"
              v-model="enforceMFA"
            />
          </div>
          <small>{{ TEXT_CONSTANTS.enforceMFA.tipText }}</small>
        </div>
        <h6 class="text-lg font-bold">{{ TEXT_CONSTANTS.sections.deleteAccount }}</h6>
        <div class="flex flex-col gap-2">
          <small>{{ TEXT_CONSTANTS.deleteAccount.tipText }}</small>
          <PrimeButton
            type="button"
            :label="TEXT_CONSTANTS.deleteAccount.label"
            @click="handleDeleteAccount"
            class="w-fit"
          />
        </div>
      </template>
    </CreateFormBlockWithEvent>
  </div>
</template>

<script setup>
  import { onMounted, ref, watch } from 'vue'
  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'
  import InputText from 'primevue/inputtext'
  import InputSwitch from 'primevue/inputswitch'
  import Dropdown from 'primevue/dropdown'
  import PrimeButton from 'primevue/button'
  import { useToast } from 'primevue/usetoast'
  import Toast from 'primevue/toast'
  import CreateFormBlockWithEvent from '@/templates/create-form-block/form-with-event'
  import { TEXT_CONSTANTS } from './constants'

  const props = defineProps({
    updateAccountSettingsService: {
      type: Function,
      required: true
    },
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

  const validationSchema = yup.object({
    name: yup.string().required(TEXT_CONSTANTS.accountName.error),
    country: yup.string().required(TEXT_CONSTANTS.country.error),
    stateRegion: yup.string().required(TEXT_CONSTANTS.stateRegion.error),
    city: yup.string().required(TEXT_CONSTANTS.city.error),
    address: yup.string().required(TEXT_CONSTANTS.address.error),
    postalCode: yup.string().required(TEXT_CONSTANTS.postalCode.error)
  })

  const { errors, meta, resetForm, values } = useForm({ validationSchema })

  const { value: name } = useField('name')
  const { value: companyName } = useField('companyName')
  const { value: companySize, setValue: setCompanySize } = useField('companySize')
  const { value: uniqueIdentifier } = useField('uniqueIdentifier')
  const { value: billingEmails } = useField('billingEmails')
  const { value: country } = useField('country')
  const { value: stateRegion } = useField('stateRegion')
  const { value: city } = useField('city')
  const { value: address } = useField('address')
  const { value: complement } = useField('complement')
  const { value: postalCode } = useField('postalCode')
  const { value: socialLogin } = useField('socialLogin')
  const { value: enforceMFA } = useField('enforceMFA')

  setCompanySize('10')

  const countriesOptions = ref([])
  const regionsOptions = ref([])
  const citiesOptions = ref([])

  const toast = useToast()
  const displayToast = (summary) => {
    toast.add({
      severity: 'error',
      summary,
      life: 5000,
      closable: true
    })
  }
  const fetchCountriesList = async () => {
    try {
      countriesOptions.value = await props.listCountriesService()
    } catch (error) {
      displayToast(error)
    }
  }

  const fetchRegionsList = async (selectedId) => {
    try {
      regionsOptions.value = await props.listRegionsService(selectedId)
    } catch (error) {
      displayToast(error)
    }
  }

  const fetchCitiesList = async (selectedId) => {
    try {
      citiesOptions.value = await props.listCitiesService(selectedId)
    } catch (error) {
      displayToast(error)
    }
  }

  onMounted(() => {
    fetchCountriesList()
  })

  watch(country, (selectedId) => {
    fetchRegionsList(selectedId)
  })

  watch(stateRegion, (selectedId) => {
    fetchCitiesList(selectedId)
  })

  const handleResponse = (response) => {
    if (response?.body?.key) {
      console.log(response)
    }
  }

  const handleDeleteAccount = () => {
    console.log('handleDeleteAccount')
  }
</script>
