<template>
  <form
    class="w-full flex flex-col gap-8"
    @submit.prevent="submitForm"
  >
    <div
      class="flex flex-col gap-2"
      v-if="additionalDataInfo?.length"
    >
      <!-- Step 1: Use -->

      <h4 class="font-semibold text-sm">{{ additionalDataInfo[0].key }}*</h4>
      <div class="flex flex-wrap gap-3 mb-8">
        <label
          v-for="useData in additionalDataInfo[0].values"
          :key="useData.value"
          :for="useData.value"
          class="flex items-center gap-2 p-4 border-1 surface-border rounded-md font-medium w-full md:w-fit"
          :class="{ 'border-radio-card-active': use === useData.value }"
          >{{ useData.value }}
          <PrimeRadio
            v-model="use"
            name="use"
            :value="useData.value"
            :inputId="useData.value"
            class="hidden"
            @change="updateStep('use')"
          />
        </label>
      </div>

      <!-- Step 2: Role -->

      <h4
        class="font-semibold text-sm"
        :class="[disabledClass(stepOptions.role)]"
      >
        {{ additionalDataInfo[1].key }}*
      </h4>
      <div
        class="flex flex-wrap gap-3 mb-8"
        :class="[disabledClass(stepOptions.role)]"
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
            :disabled="isFieldDisabled(stepOptions.role)"
            class="hidden"
            @change="updateStep('role')"
          />
        </label>
      </div>

      <!-- Step 2: Role Description -->

      <div
        class="mb-8 w-full md:w-1/2"
        v-if="showInputRoleField"
      >
        <div class="w-full flex flex-col gap-2">
          <label
            class="flex flex-col gap-3 font-semibold text-sm"
            for="inputRole"
          >
            Describe your role*
            <PrimeInputText
              v-model="inputRole"
              name="inputRole"
              id="inputRole"
            />
          </label>
          <small
            v-if="errors.inputRole"
            class="p-error text-xs font-normal leading-tight"
          >
            {{ errors.inputRole }}
          </small>
        </div>
      </div>

      <!-- Step 3: Company Size -->

      <h4
        class="font-semibold text-sm"
        :class="[disabledClass(stepOptions.companySize)]"
        v-if="showCompanySizeField"
      >
        {{ additionalDataInfo[2].key }}*
      </h4>
      <div
        class="flex flex-wrap gap-3 mb-8"
        :class="[disabledClass(stepOptions.companySize)]"
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
            :disabled="isFieldDisabled(stepOptions.companySize)"
            class="hidden"
            @change="updateStep('companySize')"
          />
        </label>
      </div>

      <!-- Step 4: Full Name -->

      <div class="mb-8 w-full md:w-1/2">
        <div class="w-full flex flex-col gap-2">
          <label
            class="flex flex-col gap-3 font-semibold text-sm"
            :class="[disabledClass(stepOptions.fullName)]"
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

      <!-- Step 3 : Company Website -->

      <div
        class="mb-8 w-full md:w-1/2"
        v-if="showCompanyWebsiteField"
      >
        <div class="w-full flex flex-col gap-2">
          <label
            class="flex flex-col gap-3 font-semibold text-sm"
            :class="[disabledClass(stepOptions.companySize)]"
            for="companyWebsite"
          >
            {{ additionalDataInfo[4].key }}*
            <PrimeInputText
              v-model="companyWebsite"
              name="companyWebsite"
              id="companyWebsite"
              :disabled="isFieldDisabled(stepOptions.companySize)"
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

      <!-- Step 5: Onboarding Session -->

      <label
        class="w-fit mb-8 flex flex-row-reverse gap-3 text-sm"
        :class="[disabledClass(stepOptions.onboardingSession)]"
        for="onboardingSession"
      >
        {{ additionalDataInfo[5].key }}*
        <PrimeInputSwitch
          class="flex-shrink-0"
          v-model="onboardingSession"
          name="onboardingSession"
          id="onboardingSession"
          :disabled="isFieldDisabled(stepOptions.onboardingSession)"
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
  import { onMounted, ref, inject, computed, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAccountStore } from '@/stores/account'
  import * as yup from 'yup'

  /** @type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const router = useRouter()
  const toast = useToast()
  const { userId } = useAccountStore()
  const accountStore = useAccountStore()

  defineOptions({
    name: 'additional-data-form-block'
  })

  const props = defineProps({
    listAdditionalDataInfoService: {
      type: Function,
      required: true
    },
    postAdditionalDataService: {
      type: Function,
      required: true
    },
    patchFullnameService: {
      type: Function,
      required: true
    },
    updateAccountInfoService: {
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
    use: yup.string().required(),
    role: yup.string().required(),
    inputRole: yup
      .string()
      .trim()
      .when('role', {
        is: (val) => val === 'Other',
        then: (schema) =>
          schema
            .max(255, 'Role Description must be less than 255 characters')
            .required('Role Description is a required field')
      }),
    companySize: yup.string().when('use', {
      is: (val) => val === 'Work',
      then: (schema) => schema.required()
    }),
    companyWebsite: yup.string().when('companySize', {
      is: (val) => val && val !== 'Just me',
      then: (schema) =>
        schema
          .trim()
          .max(255, 'Company Website must be less than 255 characters')
          .matches(
            /[-a-zA-Z0-9._+=]+\.[a-zA-Z0-9]+\b([-a-zA-Z0-9.]*)/,
            'Company Website is a required field'
          )
    }),
    fullName: yup
      .string()
      .trim()
      .max(61, 'Your Full Name must be less than 61 characters')
      .matches(/[A-zÀ-ž.'-]+ [A-zÀ-ž.'-]+/, 'Your Full Name is a required field'),
    onboardingSession: yup.boolean()
  })

  const { values, resetField, meta, errors } = useForm({
    validationSchema,
    initialValues: {
      onboardingSession: true
    }
  })

  const { value: use } = useField('use')
  const { value: role } = useField('role')
  const { value: inputRole } = useField('inputRole')
  const { value: companySize } = useField('companySize')
  const { value: companyWebsite } = useField('companyWebsite')
  const { value: fullName } = useField('fullName')
  const { value: onboardingSession } = useField('onboardingSession')

  const stepOptions = {
    use: 1,
    role: 2,
    companySize: 3,
    fullName: 4,
    onboardingSession: 5
  }

  const updateStep = (step) => {
    const updateFromStep = {
      use: () => (currentStep.value = stepOptions.role),
      role: () => {
        if (use.value === 'Work') {
          currentStep.value = stepOptions.companySize
        } else {
          currentStep.value = stepOptions.fullName
        }
      },
      companySize: () => (currentStep.value = stepOptions.fullName),
      fullName: () => (currentStep.value = stepOptions.onboardingSession)
    }

    if (fullName.value) {
      currentStep.value = stepOptions.onboardingSession
      return
    }

    updateFromStep[step]()
  }

  const disabledClass = (step) => {
    return currentStep.value < step ? 'p-disabled' : ''
  }

  const isFieldDisabled = (step) => {
    return currentStep.value < step
  }

  const showInputRoleField = computed(() => {
    return role.value === 'Other'
  })

  const showCompanySizeField = computed(() => {
    return use.value === 'Work'
  })

  const showCompanyWebsiteField = computed(() => {
    return companySize.value && companySize.value !== 'Just me'
  })

  const loading = ref(false)

  const submitForm = async () => {
    loading.value = true

    try {
      const additionalDataPayload = {
        ...values,
        id: userId
      }

      const usersPayload = fullName.value

      const accountPayload = role.value

      const patchName = props.patchFullnameService(usersPayload)

      const postAddData = props.postAdditionalDataService({
        payload: additionalDataPayload,
        options: additionalDataInfo.value
      })
      await patchName
      await postAddData

      const updatedAccount = await props.updateAccountInfoService(accountPayload)
      accountStore.setAccountData({ jobRole: updatedAccount.jobRole })

      tracker.signUp.submittedAdditionalData(values).track()

      router.push({
        name: 'home',
        query: onboardingSession.value ? { onboardingSession: 'true' } : {}
      })
    } catch (err) {
      const errors = JSON.parse(err)

      toast.add({ life: 5000, severity: 'error', detail: errors.errorMessage, summary: 'Error' })

      tracker.signUp.failedSubmitAdditionalData(errors).track()
    } finally {
      loading.value = false
    }
  }

  watch(use, (value) => {
    if (value !== 'Work') {
      resetField('companySize')
      if (role.value) {
        updateStep('role')
      }
    }
  })

  defineExpose({
    submitForm,
    loading,
    hasFormValues: additionalDataInfo.value?.length,
    meta
  })
</script>
