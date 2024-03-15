<template>
  <form
    class="w-full flex flex-col gap-8"
    @submit.prevent="submitForm"
  >
    <div class="flex flex-col gap-2">
      <label class="font-semibold text-sm">I'm a</label>
      <div class="flex flex-col gap-3 mb-8">
        <template v-if="!jobFunctionList.length">
          <PrimeSkeleton
            class="w-full h-14"
            v-for="item in 5"
            :key="item"
          />
        </template>
        <template v-else>
          <label
            v-for="item in jobFunctionList"
            :key="item.value"
            class="w-full border-1 rounded-md surface-border font-medium flex align-items-center justify-between p-4 gap-2"
            :class="{ 'border-radio-card-active': jobFunction === item.value }"
            >{{ item.label }}
            <PrimeRadio
              v-model="jobFunction"
              :value="item.value"
            />
          </label>
        </template>
      </div>
      <label class="font-semibold text-sm">What would you like to build with Azion?</label>
      <div class="flex flex-wrap gap-3">
        <template v-if="!jobFunctionList.length">
          <PrimeSkeleton
            class="w-full h-14"
            v-for="item in 5"
            :key="item"
          />
        </template>
        <template v-else>
          <label
            v-for="item in projectTypeSelectionList"
            :key="item.value"
            class="w-full border-1 rounded-md surface-border font-medium flex align-items-center justify-between p-4 gap-2"
            :class="{ 'border-radio-card-active': projectTypeSelection === item.value }"
            >{{ item.label }}
            <PrimeRadio
              v-model="projectTypeSelection"
              :value="item.value"
            />
          </label>
        </template>
      </div>
      <div
        class="flex flex-col gap-8"
        v-if="isInternal"
      >
        <PrimeSkeleton
          class="w-full h-8"
          v-if="!countriesList.length"
        />
        <div v-else>
          <label class="font-semibold text-sm gap-2 flex flex-col"
            >Company Name
            <PrimeInputText
              placeholder="My company"
              v-model="companyName"
              type="text"
            />
          </label>
          <small
            v-if="errors.companyName"
            class="p-error text-xs font-normal leading-tight"
            >{{ errors.companyName }}</small
          >
        </div>
        <PrimeSkeleton
          class="w-full h-8"
          v-if="!countriesList.length"
        />
        <div
          v-else
          class="animate-fadeIn"
        >
          <label class="font-semibold text-sm gap-2 flex flex-col"
            >Company Size
            <PrimeDropdown
              appendTo="self"
              placeholder="Select an option"
              v-model="companySize"
              :options="companySizeList"
              optionLabel="label"
              optionValue="value"
            />
          </label>
          <small
            v-if="errors.companySize"
            class="p-error text-xs font-normal leading-tight"
            >{{ errors.companySize }}</small
          >
        </div>
        <PrimeSkeleton
          class="w-full h-8"
          v-if="!countriesList.length"
        />
        <div v-else>
          <label class="font-semibold text-sm gap-2 flex flex-col"
            >Country
            <PrimeDropdown
              appendTo="self"
              placeholder="Select an option"
              v-model="country"
              :options="countriesList"
              optionLabel="name"
              optionValue="name"
              filter
            />
          </label>
          <small
            v-if="errors.country"
            class="p-error text-xs font-normal leading-tight"
            >{{ errors.country }}</small
          >
        </div>
      </div>
    </div>
    <PrimeButton
      label="Finish Signup"
      type="submit"
      :disabled="!meta.valid"
      :loading="loading"
    />
  </form>
</template>

<script setup>
  import PrimeButton from 'primevue/button'
  import PrimeDropdown from 'primevue/dropdown'
  import PrimeInputText from 'primevue/inputtext'
  import PrimeRadio from 'primevue/radiobutton'
  import PrimeSkeleton from 'primevue/skeleton'
  import { useToast } from 'primevue/usetoast'
  import { useField, useForm } from 'vee-validate'
  import { computed, onMounted, ref, inject } from 'vue'
  import { useRouter } from 'vue-router'
  import * as yup from 'yup'
  /** @type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineOptions({
    name: 'additional-data-form-block'
  })

  const props = defineProps({
    listAdditionalDataInfoService: {
      type: Function,
      required: true
    },
    listCountriesService: {
      type: Function,
      required: true
    },
    putAdditionalDataService: {
      type: Function,
      required: true
    }
  })

  const fetchAdditionalDataInfo = async () => {
    const results = await props.listAdditionalDataInfoService()
    const { companySizes, jobFunctions } = results
    companySizeList.value = companySizes
    jobFunctionList.value = jobFunctions
  }

  const fetchCountries = async () => {
    const { countries } = await props.listCountriesService()
    countriesList.value = countries
  }

  onMounted(() => {
    fetchAdditionalDataInfo()
    fetchCountries()
  })

  const companySizeList = ref([])
  const countriesList = ref([])
  const jobFunctionList = ref([])
  const projectTypeSelectionList = [
    { label: 'Just a personal project', value: 'personal' },
    { label: 'Internal project for my company', value: 'internal' },
    { label: 'Multiple projects for other companies', value: 'multiple_project' },
    { label: 'Other', value: 'other' }
  ]

  const typeToEnableCompanyFields = 'internal'

  const validationSchema = yup.object({
    jobFunction: yup.string().required(),
    projectTypeSelection: yup.string().required(),
    companyName: yup.string().when('projectTypeSelection', {
      is: typeToEnableCompanyFields,
      then: () =>
        yup
          .string()
          .max(50, 'Exceeded number of characters')
          .required('Company Name is a required field.')
    }),
    companySize: yup.string().when('projectTypeSelection', {
      is: typeToEnableCompanyFields,
      then: () => yup.string().required('Company Size is a required field.')
    }),
    country: yup.string().when('projectTypeSelection', {
      is: typeToEnableCompanyFields,
      then: () => yup.string().required('Country is a required field.')
    })
  })

  const { values, meta, errors } = useForm({ validationSchema })

  const isInternal = computed(() => {
    return projectTypeSelection.value === typeToEnableCompanyFields
  })

  const { value: jobFunction } = useField('jobFunction')
  const { value: projectTypeSelection } = useField('projectTypeSelection')
  const { value: companySize } = useField('companySize')
  const { value: country } = useField('country')
  const { value: companyName } = useField('companyName')

  const loading = ref(false)

  const router = useRouter()
  const toast = useToast()

  const submitForm = async () => {
    loading.value = true

    try {
      const form = { ...values }

      if (!isInternal.value) {
        delete form.companyName
        delete form.companySize
        delete form.country
      }

      await props.putAdditionalDataService(form)
      tracker.signUp.submittedAdditionalData()

      router.push({ name: 'home' })
    } catch (err) {
      toast.add({ life: 5000, severity: 'error', detail: err, summary: 'Error' })
      tracker.signUp.failedSubmitAdditionalData().track()
    } finally {
      loading.value = false
    }
  }
</script>
