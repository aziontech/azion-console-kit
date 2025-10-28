<template>
  <form
    class="w-full flex flex-col"
    @submit.prevent="submitForm"
  >
    <div
      class="flex flex-col gap-8"
      v-if="additionalDataInfo?.length"
    >
      <!-- Step 1: Plan -->
      <FieldGroupRadio
        :label="questionLabel('use')"
        nameField="use"
        auto
        hideSelector
        :options="adaptOptions('use')"
        @onRadioChange="updateStep('use')"
      />

      <!-- Step 2: Role -->
      <FieldGroupRadio
        :label="questionLabel('role')"
        nameField="role"
        auto
        hideSelector
        :disabled="isFieldDisabled(stepOptions.role)"
        :options="adaptOptions('role')"
        @onRadioChange="updateStep('role')"
      />

      <!-- Step 2: Role Description -->
      <div
        class="w-full md:w-1/2"
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
      <FieldGroupRadio
        v-if="showCompanySizeField"
        :label="questionLabel('companySize')"
        nameField="companySize"
        auto
        hideSelector
        :disabled="isFieldDisabled(stepOptions.companySize)"
        :options="adaptOptions('companySize')"
        @onRadioChange="updateStep('companySize')"
      />

      <!-- Step 4: Full Name -->
      <div class="w-full md:w-1/2">
        <div class="w-full flex flex-col gap-2">
          <label
            class="flex flex-col gap-3 font-semibold text-sm"
            :class="[disabledClass(stepOptions.fullName)]"
            for="fullName"
          >
            {{ questionLabel('fullName') }}
            <PrimeInputText
              v-model="fullName"
              name="fullName"
              id="fullName"
              :disabled="isFieldDisabled(stepOptions.fullName)"
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
        class="w-full md:w-1/2"
        v-if="showCompanyWebsiteField"
      >
        <div class="w-full flex flex-col gap-2">
          <label
            class="flex flex-col gap-3 font-semibold text-sm"
            :class="[disabledClass(stepOptions.companySize)]"
            for="companyWebsite"
          >
            {{ questionLabel('companyWebsite') }}
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
      <FieldSwitchBlock
        :title="questionLabel('onboardingSession')"
        name="onboardingSession"
        nameField="onboardingSession"
        :isCard="false"
        :disabled="isFieldDisabled(stepOptions.onboardingSession)"
      />
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
  import PrimeInputText from 'primevue/inputtext'
  import PrimeSkeleton from 'primevue/skeleton'
  import { useToast } from 'primevue/usetoast'
  import { useField, useForm } from 'vee-validate'
  import { ref, inject, computed, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAccountStore } from '@/stores/account'
  import * as yup from 'yup'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'

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
  const additionalDataInfo = ref([
    {
      id: 1,
      key: 'How are you planning to use Azion?',
      required: true,
      show: true,
      values: [
        {
          id: 1,
          value: 'Personal',
          other_values: false
        },
        {
          id: 2,
          value: 'Work',
          other_values: false
        },
        {
          id: 3,
          value: 'Study',
          other_values: false
        }
      ]
    },
    {
      id: 2,
      key: 'What best describes your role?',
      required: true,
      show: true,
      values: [
        {
          id: 4,
          value: 'Software Developer',
          other_values: false
        },
        {
          id: 5,
          value: 'DevOps Engineer',
          other_values: false
        },
        {
          id: 6,
          value: 'Infrastructure Analyst',
          other_values: false
        },
        {
          id: 7,
          value: 'Network Engineer',
          other_values: false
        },
        {
          id: 8,
          value: 'Security Specialist',
          other_values: false
        },
        {
          id: 9,
          value: 'Data Engineer',
          other_values: false
        },
        {
          id: 10,
          value: 'AI/ML Engineer',
          other_values: false
        },
        {
          id: 11,
          value: 'IoT Engineer',
          other_values: false
        },
        {
          id: 12,
          value: 'Team Lead',
          other_values: false
        },
        {
          id: 13,
          value: 'Other',
          other_values: true
        }
      ]
    },
    {
      id: 3,
      key: 'How big is your company?',
      required: false,
      show: true,
      values: [
        {
          id: 14,
          value: 'Just me',
          other_values: false
        },
        {
          id: 15,
          value: '2 to 100 employees',
          other_values: false
        },
        {
          id: 16,
          value: '101 to 500 employees',
          other_values: false
        },
        {
          id: 17,
          value: '501 to 1000 employees',
          other_values: false
        },
        {
          id: 18,
          value: '1001+ employees',
          other_values: false
        }
      ]
    },
    {
      id: 999,
      key: 'Your Full Name',
      required: true,
      show: true
    },
    {
      id: 4,
      key: 'Company Website?',
      required: false,
      show: true,
      values: [
        {
          id: 19,
          value: '',
          other_values: true
        }
      ]
    },
    {
      id: 5,
      key: 'Do you want to schedule a onboarding session with an Azion expert?',
      required: false,
      show: true,
      values: [
        {
          id: 20,
          value: 'Yes',
          other_values: false
        },
        {
          id: 21,
          value: 'No',
          other_values: false
        }
      ]
    }
  ])

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
      then: (schema) => schema.required('Company Size is a required field')
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
          .required('Company Website is a required field')
    }),
    fullName: yup
      .string()
      .trim()
      .max(61, 'Your Full Name must be less than 61 characters')
      .matches(/[A-zÀ-ž.'-]+ [A-zÀ-ž.'-]+/, 'Your Full Name is a required field')
      .required(),
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

  const questionsMap = {
    use: 0,
    role: 1,
    companySize: 2,
    fullName: 3,
    companyWebsite: 4,
    onboardingSession: 5
  }

  const adaptOptions = (step) => {
    const options = additionalDataInfo?.value[questionsMap[step]]?.values

    return options?.map((option) => {
      return {
        title: option.value,
        inputValue: option.value
      }
    })
  }

  const questionLabel = (step, required = true) => {
    const idx = questionsMap[step]
    return required ? `${additionalDataInfo.value[idx]?.key}*` : additionalDataInfo.value[idx]?.key
  }

  const loading = ref(false)

  const submitForm = async () => {
    loading.value = true

    try {
      const usersPayload = fullName.value
      const accountPayload = role.value
      const additionalDataPayload = {
        ...values,
        id: userId
      }

      const updatedAccount = await props.updateAccountInfoService(accountPayload)
      accountStore.setAccountData({ jobRole: updatedAccount.jobRole })

      const patchName = props.patchFullnameService(usersPayload)
      const postAddData = props.postAdditionalDataService({
        payload: additionalDataPayload,
        options: additionalDataInfo.value
      })

      await patchName
      await postAddData

      tracker.signUp.submittedAdditionalData(values).track()
    } catch (err) {
      const errors = JSON.parse(err)

      toast.add({ severity: 'error', detail: errors.errorMessage, summary: 'Error' })

      tracker.signUp.failedSubmitAdditionalData(errors).track()
    } finally {
      router.push({
        name: 'home',
        query: onboardingSession.value ? { onboardingSession: 'true' } : {}
      })
      loading.value = false
    }
  }

  watch(use, (value) => {
    if (value !== 'Work') {
      resetField('companySize')
      resetField('companyWebsite')
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
