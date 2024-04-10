<template>
  <form
    class="w-full flex flex-col gap-8"
    @submit.prevent="submitForm"
  >
    <div class="flex flex-col gap-2">
      <template
        v-for="step in additionalDataInfo"
        :key="step.key"
      >
        <h4
          class="font-semibold text-sm"
          :class="{ 'text-color-secondary': !step.show }"
        >
          {{ step.key }}{{ step.required && '*' }}
        </h4>
        <div
          class="flex flex-wrap gap-3 mb-8"
          :class="{ 'text-color-secondary': !step.show }"
        >
          <label
            v-for="item in step.values"
            :key="item.value"
            :for="item.value"
            class="w-fit border-1 rounded-md surface-border font-medium flex align-items-center justify-between p-4 gap-2"
            :class="{
              'border-radio-card-active': values[step.type]?.value === item.value
            }"
            >{{ item.value }}
            <PrimeRadio
              :modelValue="values[step.type]"
              @update:modelValue="updateValues(step, item)"
              :name="step.type"
              :inputId="item.value"
              :disabled="!step.show"
              class="hidden"
            />
          </label>
        </div>
      </template>
    </div>
  </form>
</template>

<script setup>
  // import PrimeButton from 'primevue/button'
  // import PrimeDropdown from 'primevue/dropdown'
  // import PrimeInputText from 'primevue/inputtext'
  import PrimeRadio from 'primevue/radiobutton'
  // import PrimeSkeleton from 'primevue/skeleton'
  import { useToast } from 'primevue/usetoast'
  import { useForm } from 'vee-validate'
  import { onMounted, ref, inject } from 'vue'
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
    putAdditionalDataService: {
      type: Function,
      required: true
    }
  })

  const additionalDataInfo = ref(null)

  const fetchAdditionalDataInfo = async () => {
    const results = await props.listAdditionalDataInfoService()
    additionalDataInfo.value = results
  }

  onMounted(() => {
    fetchAdditionalDataInfo()
  })

  const validationSchema = yup.object({
    plan: yup.string().required(),
    role: yup.string().required()
    // companyName: yup.string().when('projectTypeSelection', {
    //   is: typeToEnableCompanyFields,
    //   then: () =>
    //     yup
    //       .string()
    //       .max(50, 'Exceeded number of characters')
    //       .required('Company Name is a required field.')
    // }),
    // companySize: yup.string().when('projectTypeSelection', {
    //   is: typeToEnableCompanyFields,
    //   then: () => yup.string().required('Company Size is a required field.')
    // }),
  })

  const { values, setValues, meta, errors } = useForm({ validationSchema })

  const updateValues = (step, itemValues) => {
    const totalKeys = Object.keys(additionalDataInfo.value).length
    const nextStep = step.id++
    setValues({ ...values, [step.type]: itemValues })

    if (nextStep >= totalKeys) return

    additionalDataInfo.value[nextStep].show = true
  }

  const loading = ref(false)

  const router = useRouter()
  const toast = useToast()

  const submitForm = async () => {
    loading.value = true

    try {
      await props.putAdditionalDataService(values)
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
