<template>
  <form
    class="w-full flex flex-col gap-8"
    @submit.prevent="submitForm"
  >
    <div
      class="flex flex-col gap-2"
      v-if="additionalDataInfo"
    >
      <template
        v-for="(step, stepIdx) in additionalDataInfo"
        :key="step.key"
      >
        <h4
          v-if="!isOnboardingSession(step)"
          class="font-semibold text-sm"
          :class="{ 'text-color-secondary': !step.show }"
        >
          {{ step.key }}{{ step.required ? '*' : '' }}
        </h4>
        <div
          class="flex flex-wrap gap-3 mb-8"
          :class="{ 'text-color-secondary': !step.show }"
        >
          <label
            v-for="item in step.values"
            :key="item.value"
            :for="item.value"
            class="flex items-center gap-2"
            :class="[getOnboardingSessionClasses(step), radioClasses(step, item)]"
            >{{ getLabelValue(step, item) }}
            <PrimeRadio
              v-if="step.fieldType === 'radio'"
              :modelValue="values[step.type]"
              @update:modelValue="updateValues(step, stepIdx, item)"
              :name="step.type"
              :inputId="item.value"
              :disabled="!step.show"
              class="hidden"
            />
            <PrimeInputText
              v-if="step.fieldType === 'text'"
              class="w-full"
              :modelValue="values[step.type]?.value"
              @update:modelValue="updateValues(step, stepIdx, { id: item.id, value: $event })"
              :id="item.value"
              :disabled="!step.show"
            />
            <PrimeInputSwitch
              v-if="step.fieldType === 'switch'"
              :modelValue="values[step.type]?.value"
              @update:modelValue="
                updateValues(step, stepIdx, { id: item.id, value: !values[step.type].value })
              "
              :disabled="!step.show"
            />
          </label>
        </div>
      </template>
    </div>
    <div
      class="flex flex-col gap-2"
      v-else
    >
      <div
        v-for="item in 5"
        :key="item"
      >
        <div class="w-full mb-8">
          <PrimeSkeleton class="w-2/3 h-4 mb-4" />
          <div class="flex flex-wrap gap-3">
            <PrimeSkeleton class="w-28 h-14" />
            <PrimeSkeleton class="w-28 h-14" />
            <PrimeSkeleton class="w-28 h-14" />
          </div>
        </div>
      </div>
    </div>
  </form>
</template>

<script setup>
  import PrimeRadio from 'primevue/radiobutton'
  import PrimeInputSwitch from 'primevue/inputswitch'
  import PrimeInputText from 'primevue/inputtext'
  import PrimeSkeleton from 'primevue/skeleton'
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

  onMounted(() => {
    fetchAdditionalDataInfo()
  })

  const validationSchema = yup.object({
    plan: yup.string().required(),
    role: yup.string().required(),
    companySize: yup.string().required(),
    fullName: yup.string().required(),
    companyWebsite: yup.string().required(),
    onboardingSession: yup.boolean()
  })

  const { values, setValues, meta, errors } = useForm({ validationSchema })

  const setOnboardingValue = () => {
    const onboardingSessionValue = additionalDataInfo.value[5].values[0]
    setValues({ ...values, onboardingSession: onboardingSessionValue })
  }

  const fetchAdditionalDataInfo = async () => {
    const results = await props.listAdditionalDataInfoService()
    additionalDataInfo.value = results

    setOnboardingValue()
  }

  const isOnboardingSession = (step) => {
    return step.type === 'onboardingSession'
  }

  const getLabelValue = (step, item) => {
    return isOnboardingSession(step) ? step.key : item.value
  }

  const getOnboardingSessionClasses = (step) => {
    const defaultClasses = 'w-1/2 rounded-md font-medium'
    const onboardingSessionClasses = 'w-fit text-sm flex-row-reverse'

    return isOnboardingSession(step) ? onboardingSessionClasses : defaultClasses
  }

  const updateValues = (step, stepIdx, itemValues) => {
    const totalKeys = Object.keys(additionalDataInfo.value).length
    const nextStep = stepIdx + 1
    setValues({ ...values, [step.type]: itemValues })

    if (nextStep >= totalKeys) return

    additionalDataInfo.value.forEach((item, idx) => {
      additionalDataInfo.value[idx].show = idx <= nextStep

      if (item.type !== 'onboardingSession' && idx > stepIdx) {
        setValues({ ...values, [item.type]: null })
      }
    })
  }

  const radioClasses = (step, item) => {
    const isRadio = step.fieldType === 'radio'
    const hasSameValue = values[step.type]?.value === item.value

    if (!isRadio) return

    if (isRadio && !hasSameValue) return 'w-fit p-4 border-1 surface-border'

    return 'w-fit p-4 border-1 border-radio-card-active'
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
