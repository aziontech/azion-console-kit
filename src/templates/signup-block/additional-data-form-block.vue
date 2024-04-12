<template>
  <form
    class="w-full flex flex-col gap-8"
    @submit.prevent="submitForm"
  >
    <div
      class="flex flex-col gap-2"
      v-if="additionalDataInfo"
    >
      <!-- Step 1: Plan -->

      <h4 class="font-semibold text-sm">{{ additionalDataInfo[0].key }}*</h4>
      <div class="flex flex-wrap gap-3 mb-8">
        <label
          v-for="planData in additionalDataInfo[0].values"
          :key="planData.value"
          :for="planData.value"
          class="flex items-center gap-2 p-4 border-1 surface-border rounded-md font-medium w-full md:w-fit"
          :class="{ 'border-radio-card-active': plan === planData.value }"
          >{{ planData.value }}
          <PrimeRadio
            v-model="plan"
            name="plan"
            :value="planData.value"
            :inputId="planData.value"
            class="hidden"
            @change="updateStep('plan')"
          />
        </label>
      </div>

      <!-- Step 2: Role -->

      <h4
        class="font-semibold text-sm"
        :class="[disabledClass(2)]"
      >
        {{ additionalDataInfo[1].key }}*
      </h4>
      <div
        class="flex flex-wrap gap-3 mb-8"
        :class="[disabledClass(2)]"
      >
        <label
          v-for="roleData in additionalDataInfo[1].values"
          :key="roleData.value"
          :for="roleData.value"
          class="flex items-center gap-2 p-4 border-1 surface-border rounded-md font-medium w-full md:w-fit"
          :class="{ 'border-radio-card-active': role === roleData.value }"
          >{{ roleData.value }}
          <PrimeRadio
            v-model="role"
            name="role"
            :value="roleData.value"
            :inputId="roleData.value"
            :disabled="isFieldDisabled(2)"
            class="hidden"
            @change="updateStep('role')"
          />
        </label>
      </div>

      <!-- Step 2: Role Description -->

      <div
        class="mb-8 w-full md:w-1/2"
        v-if="showRoleDescriptionField"
      >
        <div class="w-full flex flex-col gap-2">
          <label
            class="flex flex-col gap-3 font-semibold text-sm"
            for="otherRole"
          >
            Describe your role*
            <PrimeInputText
              v-model="roleDescription"
              name="role"
              id="otherRole"
            />
          </label>
          <small
            v-if="errors.roleDescription"
            class="p-error text-xs font-normal leading-tight"
          >
            {{ errors.roleDescription }}
          </small>
        </div>
      </div>

      <!-- Step 3: Company Size -->

      <h4
        class="font-semibold text-sm"
        :class="[disabledClass(3)]"
        v-if="showCompanySizeField"
      >
        {{ additionalDataInfo[2].key }}*
      </h4>
      <div
        class="flex flex-wrap gap-3 mb-8"
        :class="[disabledClass(3)]"
        v-if="showCompanySizeField"
      >
        <label
          v-for="companySizeData in additionalDataInfo[2].values"
          :key="companySizeData.value"
          :for="companySizeData.value"
          class="flex items-center gap-2 p-4 border-1 surface-border rounded-md font-medium w-full md:w-fit"
          :class="{ 'border-radio-card-active': companySize === companySizeData.value }"
          >{{ companySizeData.value }}
          <PrimeRadio
            v-model="companySize"
            name="companySize"
            :value="companySizeData.value"
            :inputId="companySizeData.value"
            :disabled="isFieldDisabled(3)"
            class="hidden"
            @change="updateStep('companySize')"
          />
        </label>
      </div>

      <!-- Step 3 : Company Website -->

      <div
        class="mb-8 w-full md:w-1/2"
        v-if="showCompanyWebsiteField"
      >
        <div class="w-full flex flex-col gap-2">
          <label
            class="flex flex-col gap-3 font-semibold text-sm"
            :class="[disabledClass(3)]"
            for="companyWebsite"
          >
            {{ additionalDataInfo[4].key }}*
            <PrimeInputText
              v-model="companyWebsite"
              name="companyWebsite"
              id="companyWebsite"
              :disabled="isFieldDisabled(3)"
            />
          </label>
          <small
            v-if="errors.companyWebsite"
            class="p-error text-xs font-normal leading-tight"
          >
            {{ errors.companyWebsite }}
          </small>
        </div>
      </div>

      <!-- Step 4: Full Name -->

      <div class="mb-8 w-full md:w-1/2">
        <div class="w-full flex flex-col gap-2">
          <label
            class="flex flex-col gap-3 font-semibold text-sm"
            :class="[disabledClass(4)]"
            for="fullName"
          >
            {{ additionalDataInfo[3].key }}*
            <PrimeInputText
              v-model="fullName"
              name="fullName"
              id="fullName"
              :disabled="isFieldDisabled(4)"
              @input="updateStep('fullName')"
            />
          </label>
          <small
            v-if="errors.fullName"
            class="p-error text-xs font-normal leading-tight"
          >
            {{ errors.fullName }}
          </small>
        </div>
      </div>

      <!-- Step 5: Onboarding Session -->

      <label
        class="w-fit mb-8 flex flex-row-reverse gap-3 text-sm"
        :class="[disabledClass(5)]"
        for="onboardingSession"
      >
        {{ additionalDataInfo[5].key }}*
        <PrimeInputSwitch
          v-model="onboardingSession"
          name="onboardingSession"
          id="onboardingSession"
          :disabled="isFieldDisabled(5)"
        />
      </label>
    </div>

    <!-- Empty state -->

    <div
      class="flex flex-col gap-2"
      v-else
    >
      <div
        v-for="item in 5"
        :key="item"
      >
        <div class="w-full mb-8">
          <PrimeSkeleton class="h-4 mb-4 w-2/3" />
          <div class="flex flex-wrap gap-3">
            <PrimeSkeleton class="h-14 w-full md:w-28" />
            <PrimeSkeleton class="h-14 w-full md:w-28" />
            <PrimeSkeleton class="h-14 w-full md:w-28" />
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
  import { useField, useForm } from 'vee-validate'
  import { onMounted, ref, inject, computed } from 'vue'
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

  const currentStep = ref(1)
  const additionalDataInfo = ref(null)

  const fetchAdditionalDataInfo = async () => {
    const response = await props.listAdditionalDataInfoService()

    additionalDataInfo.value = response
  }

  onMounted(() => {
    fetchAdditionalDataInfo()
  })

  const validationSchema = yup.object({
    plan: yup.string().required(),
    role: yup.string().required(),
    roleDescription: yup.string().when('role', {
      is: (val) => val === 'Other',
      then: (schema) => schema.required('Role Description is a required field')
    }),
    companySize: yup.string().when('plan', {
      is: (val) => val === 'Work',
      then: (schema) => schema.required()
    }),
    companyWebsite: yup.string().when('companySize', {
      is: (val) => val && val !== 'Just me',
      then: (schema) => schema.required('Company Website is a required field')
    }),
    fullName: yup.string().required('Full Name is a required field'),
    onboardingSession: yup.boolean()
  })

  const { values, meta, errors } = useForm({
    validationSchema,
    initialValues: {
      onboardingSession: true
    }
  })

  const { value: plan } = useField('plan')
  const { value: role } = useField('role')
  const { value: roleDescription } = useField('roleDescription')
  const { value: companySize } = useField('companySize')
  const { value: companyWebsite } = useField('companyWebsite')
  const { value: fullName } = useField('fullName')
  const { value: onboardingSession } = useField('onboardingSession')

  const updateStep = (step) => {
    const updateFromStep = {
      plan: () => (currentStep.value = 2), // role
      role: () => {
        if (plan.value === 'Work') {
          currentStep.value = 3 // company size
        } else {
          currentStep.value = 4 // full name
        }
      },
      companySize: () => (currentStep.value = 4), // full name
      fullName: () => (currentStep.value = 5) // onboarding session
    }

    updateFromStep[step]()
  }

  const disabledClass = (step) => {
    return currentStep.value < step ? 'text-color-secondary' : ''
  }

  const isFieldDisabled = (step) => {
    return currentStep.value < step
  }

  const showRoleDescriptionField = computed(() => {
    return role.value === 'Other'
  })

  const showCompanySizeField = computed(() => {
    return plan.value === 'Work'
  })

  const showCompanyWebsiteField = computed(() => {
    return companySize.value && companySize.value !== 'Just me'
  })

  const loading = ref(false)

  const router = useRouter()
  const toast = useToast()

  const submitForm = async () => {
    loading.value = true

    try {
      console.log(values)
      // await props.putAdditionalDataService(values)
      // tracker.signUp.submittedAdditionalData()

      // router.push({ name: 'home' })
    } catch (err) {
      toast.add({ life: 5000, severity: 'error', detail: err, summary: 'Error' })
      tracker.signUp.failedSubmitAdditionalData().track()
    } finally {
      loading.value = false
    }
  }

  defineExpose({
    submitForm,
    loading,
    meta
  })
</script>
