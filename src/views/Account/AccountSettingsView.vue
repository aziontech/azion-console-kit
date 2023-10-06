<template>
  <div>
    <PrimeDialog
      v-model:visible="showDeleteModal"
      modal
      position="center"
      :dismissableMask="true"
      :showHeader="false"
      :breakpoints="{ '641px': '90vw' }"
      :style="{ marginTop: '0px', width: '540px', maxHeight: '21rem' }"
      :pt="{
        root: { class: 'p-0 rounded-md' },
        content: { class: 'p-0 rounded-md' }
      }"
    >
      <div class="flex flex-col p-4 gap-4">
        <div class="flex flex-col text-center gap-2">
          <span class="text-4xl pi pi-exclamation-triangle" />
          <h6 class="text-lg font-bold">{{ TEXT_CONSTANTS.deleteAccount.modal.title }}</h6>
          <small>{{ TEXT_CONSTANTS.deleteAccount.modal.description }}</small>
        </div>
        <div class="flex flex-col gap-2">
          <label for="deleteAccount">{{ TEXT_CONSTANTS.deleteAccount.modal.confirmation }}</label>
          <InputText
            id="deleteAccount"
            v-model="deleteConfirmation"
            type="text"
          />
        </div>
        <div class="flex justify-center gap-2">
          <PrimeButton
            :label="TEXT_CONSTANTS.deleteAccount.modal.cancel"
            severity="primary"
            outlined
            @click="showDeleteModal = false"
          />
          <PrimeButton
            :label="TEXT_CONSTANTS.deleteAccount.modal.confirm"
            severity="primary"
            @click="deleteAccount"
            :disabled="!isDeletionAllowed"
          />
        </div>
      </div>
    </PrimeDialog>
    <Toast />
    <CreateFormBlockWithEvent
      :pageTitle="TEXT_CONSTANTS.title"
      :createService="props.updateAccountSettingsService"
      :formData="values"
      :isValid="meta.valid"
      :cleanFormCallback="resetForm"
      @on-response="handleUpdated"
      :isRequestSuccess="isUpdated"
    >
      <template #form>
        <h6 class="text-lg font-bold">{{ TEXT_CONSTANTS.sections.accountProfile }}</h6>
        <div class="flex flex-col gap-2">
          <label for="id">{{ TEXT_CONSTANTS.id.label }}</label>
          <p id="id">{{ accountSettings.id }}</p>
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
            :options="countriesOptions"
            :class="{ 'p-invalid': errors.country }"
            v-model="country"
            @change="fetchRegionsList(country.id, true)"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="region">{{ TEXT_CONSTANTS.region.label }}</label>
          <Dropdown
            id="region"
            optionLabel="name"
            :options="regionsOptions"
            :class="{ 'p-invalid': errors.region }"
            v-model="region"
            @change="fetchCitiesList(region.id)"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="city">{{ TEXT_CONSTANTS.city.label }}</label>
          <Dropdown
            id="city"
            optionLabel="name"
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
            <label for="isSocialLoginEnabled">{{ TEXT_CONSTANTS.socialLogin.label }}</label>
            <InputSwitch
              id="isSocialLoginEnabled"
              v-model="isSocialLoginEnabled"
            />
          </div>
          <small>{{ TEXT_CONSTANTS.socialLogin.tipText }}</small>
        </div>
        <div class="flex flex-col gap-2">
          <div class="flex gap-3 items-center">
            <label for="isEnabledMfaToAllUsers">{{ TEXT_CONSTANTS.enforceMFA.label }}</label>
            <InputSwitch
              id="isEnabledMfaToAllUsers"
              v-model="isEnabledMfaToAllUsers"
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
  import { computed, onMounted, ref } from 'vue'
  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'
  import { useToast } from 'primevue/usetoast'
  import Toast from 'primevue/toast'
  import InputText from 'primevue/inputtext'
  import InputSwitch from 'primevue/inputswitch'
  import Dropdown from 'primevue/dropdown'
  import PrimeButton from 'primevue/button'
  import PrimeDialog from 'primevue/dialog'
  import CreateFormBlockWithEvent from '@/templates/create-form-block/form-with-event'
  import { TEXT_CONSTANTS } from './constants'

  const props = defineProps({
    deleteAccountService: {
      type: Function,
      required: true
    },
    getAccountSettingsService: {
      type: Function,
      required: true
    },
    listCitiesService: {
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
    updateAccountSettingsService: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    name: yup.string().required(TEXT_CONSTANTS.accountName.error),
    country: yup.object().nullable().required(TEXT_CONSTANTS.country.error),
    // region: yup.object().nullable().required(TEXT_CONSTANTS.region.error),
    // city: yup.object().nullable().required(TEXT_CONSTANTS.city.error),
    address: yup.string().required(TEXT_CONSTANTS.address.error),
    postalCode: yup.string().required(TEXT_CONSTANTS.postalCode.error)
  })

  const { errors, meta, resetForm, values } = useForm({ validationSchema })

  const { value: name, setValue: setName } = useField('name')
  const { value: companyName, setValue: setCompanyName } = useField('companyName')
  const { value: companySize, setValue: setCompanySize } = useField('companySize')
  const { value: uniqueIdentifier, setValue: setUniqueIdentifier } = useField('uniqueIdentifier')
  const { value: billingEmails, setValue: setBillingEmails } = useField('billingEmails')
  const { value: country, setValue: setCountry } = useField('country')
  const { value: region, setValue: setRegion } = useField('region')
  const { value: city, setValue: setCity } = useField('city')
  const { value: address, setValue: setAddress } = useField('address')
  const { value: complement, setValue: setComplement } = useField('complement')
  const { value: postalCode, setValue: setPostalCode } = useField('postalCode')
  const { value: isSocialLoginEnabled, setValue: setSocialLogin } = useField('isSocialLoginEnabled')
  const { value: isEnabledMfaToAllUsers, setValue: setEnforceMFA } =
    useField('isEnabledMfaToAllUsers')

  const accountSettings = ref({})
  const countriesOptions = ref([])
  const regionsOptions = ref([])
  const citiesOptions = ref([])

  const toast = useToast()
  const displayToast = (severity, summary) => {
    toast.add({
      severity,
      summary,
      life: 5000,
      closable: true
    })
  }

  onMounted(async () => {
    await fetchCountriesList()
    fetchAccountSettings()
  })

  const fetchAccountSettings = async () => {
    try {
      accountSettings.value = await props.getAccountSettingsService()
      setAccountFields()
    } catch (error) {
      displayToast('error', error)
    }
  }

  const setAddressDropdownOption = (id, list, callback) => {
    const selectedOption = list.value.find((option) => option.id === `${id}`)
    callback(selectedOption)
  }

  const setAccountFields = () => {
    const data = accountSettings.value

    setName(data.name)
    setCompanyName(data.companyName)
    setCompanySize(data.companySize)
    setUniqueIdentifier(data.uniqueIdentifier)
    setBillingEmails(data.billingEmails)
    setAddressDropdownOption(data.countryId, countriesOptions, setCountry)
    fetchRegionsList(data.countryId, false)
    fetchCitiesList(data.regionId, false)
    setAddress(data.address)
    setComplement(data.complement)
    setPostalCode(data.postalCode)
    setSocialLogin(data.isSocialLoginEnabled)
    setEnforceMFA(data.isEnabledMfaToAllUsers)
  }

  const fetchCountriesList = async () => {
    try {
      countriesOptions.value = await props.listCountriesService()
    } catch (error) {
      displayToast('error', error)
    }
  }

  const fetchRegionsList = async (selectedId, isCountryTouched) => {
    try {
      if (isCountryTouched) {
        regionsOptions.value = await props.listRegionsService(selectedId)
      } else {
        regionsOptions.value = await props.listRegionsService(accountSettings.value.countryId)
        const { regionId } = accountSettings.value
        setAddressDropdownOption(regionId, regionsOptions, setRegion)
      }
    } catch (error) {
      displayToast('error', error)
    }
  }

  const fetchCitiesList = async (selectedId, isRegionTouched) => {
    try {
      if (isRegionTouched) {
        citiesOptions.value = await props.listCitiesService(selectedId)
      } else {
        citiesOptions.value = await props.listCitiesService(accountSettings.value.regionId)
        const { cityId } = accountSettings.value
        setAddressDropdownOption(cityId, citiesOptions, setCity)
      }
    } catch (error) {
      displayToast('error', error)
    }
  }

  const isUpdated = ref(false)
  const handleUpdated = () => {
    displayToast('success', 'Updated successfully')
    isUpdated.value = true
  }

  const showDeleteModal = ref(false)
  const handleDeleteAccount = () => {
    showDeleteModal.value = true
  }

  const deleteConfirmation = ref('')
  const isDeletionAllowed = computed(() => {
    return deleteConfirmation.value === 'delete'
  })

  const deleteAccount = async () => {
    try {
      await props.deleteAccountService()
      showDeleteModal.value = false
      window.location.href = '/logout'
    } catch (error) {
      showDeleteModal.value = false
      displayToast('error', error)
    }
  }
</script>
