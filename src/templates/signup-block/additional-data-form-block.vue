<template>
  <form
    class="w-full flex flex-col gap-6"
    @submit.prevent="submitForm"
  >
    <div class="flex flex-col gap-2">
      <label class="font-semibold text-sm">I'm a</label>
      <div class="flex flex-col gap-3 mb-8">
        <template v-if="!jobFunctionList.length">
          <PrimeSkeleton
            class="w-full h-14"
            v-for="item in [...Array(5).keys()]"
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
      <div class="flex flex-wrap gap-3 mb-8">
        <template v-if="!jobFunctionList.length">
          <PrimeSkeleton
            class="w-full h-14"
            v-for="item in [...Array(5).keys()]"
            :key="item"
          />
        </template>
        <template v-else>
          <label
            v-for="item in projectTypeList"
            :key="item.value"
            class="w-full border-1 rounded-md surface-border font-medium flex align-items-center justify-between p-4 gap-2"
            :class="{ 'border-radio-card-active': projectType === item.value }"
            >{{ item.label }}
            <PrimeRadio
              v-model="projectType"
              :value="item.value"
            />
          </label>
        </template>
      </div>
      <div class="flex flex-col gap-8">
        <PrimeSkeleton
          class="w-full h-8"
          v-if="!countriesList.length"
        />
        <label
          class="font-semibold text-sm gap-2 flex flex-col"
          v-else
          >Company name
          <PrimeInputText
            placeholder="Company Name"
            v-model="companyName"
            type="text"
          />
        </label>
        <PrimeSkeleton
          class="w-full h-8"
          v-if="!countriesList.length"
        />
        <label
          class="font-semibold text-sm gap-2 flex flex-col"
          v-else
          >Company size
          <PrimeDropdown
            placeholder="Select an option"
            v-model="companySize"
            :options="companySizeList"
            optionLabel="label"
            optionValue="value"
          />
        </label>
        <PrimeSkeleton
          class="w-full h-8"
          v-if="!countriesList.length"
        />
        <label
          class="font-semibold text-sm gap-2 flex flex-col"
          v-else
          >Country
          <PrimeDropdown
            placeholder="Select an option"
            v-model="country"
            :options="countriesList"
            optionLabel="name"
            optionValue="id"
            filter
          />
        </label>
      </div>
    </div>
    <PrimeButton
      label="Finish Signup"
      type="submit"
      severity="secondary"
      :disabled="!meta.valid"
      :loading="loading"
    />
  </form>
</template>

<script setup>
  import PrimeRadio from 'primevue/radiobutton'
  import PrimeButton from 'primevue/button'
  import PrimeInputText from 'primevue/inputtext'
  import PrimeDropdown from 'primevue/dropdown'
  import PrimeSkeleton from 'primevue/skeleton'
  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'
  import { ref, onMounted } from 'vue'

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
    }
  })

  const fetchAdditionalDataInfo = async () => {
    const results = await props.listAdditionalDataInfoService()
    const { company_sizes, job_functions } = results
    companySizeList.value = company_sizes
    jobFunctionList.value = job_functions
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
  const projectTypeList = [
    { label: 'Just a personal project', value: 'personal' },
    { label: 'Internal project for my company', value: 'internal' },
    { label: 'Multiple projects for other companies', value: 'multiple_project' },
    { label: 'Other', value: 'other' }
  ]

  const typeToEnableCompanyFields = 'internal'

  const validationSchema = yup.object({
    jobFunction: yup.string().required(),
    projectType: yup.string().required(),
    companyName: yup.string().when('projectType', {
      is: typeToEnableCompanyFields,
      then: yup
        .string()
        .max(50, 'Exceeded number of characters')
        .required('Company name is required')
    }),
    companySize: yup.string().when('projectType', {
      is: typeToEnableCompanyFields,
      then: yup.string().required('Company size is required')
    }),
    country: yup.string().when('projectType', {
      is: typeToEnableCompanyFields,
      then: yup.string().required('Country is required')
    })
  })

  const { values, meta } = useForm({ validationSchema })

  const { value: jobFunction } = useField('jobFunction')
  const { value: projectType } = useField('projectType')
  const { value: companyName } = useField('companyName')
  const { value: companySize } = useField('companySize')
  const { value: country } = useField('country')

  const loading = ref(false)

  const submitForm = () => {
    return values
  }
</script>
