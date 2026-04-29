<template>
  <form
    class="w-full flex flex-col"
    @submit.prevent="submitForm"
  >
    <div
      class="flex flex-col gap-8"
      v-if="isFormReady"
    >
      <!-- Plan Selector Card -->
      <div class="flex flex-col gap-2">
        <label class="text-xs leading-4 text-color-secondary">Plan Selected</label>
        <PlanSelectorCard
          :plan="plan"
          :planData="selectedPlanData"
          :billingCycle="billingCycle"
          @change="openPlanDrawer"
        />
      </div>

      <!-- How are you planning to use Azion? -->
      <div class="flex flex-col gap-2">
        <label class="text-xs leading-4 text-color-secondary">
          How are you planning to use Azion?
          <span class="text-primary">*</span>
        </label>
        <BoxGridSelection
          v-model="usageIntent"
          :items="usageIntentOptions"
        />
      </div>

      <!-- Role -->
      <Transition name="expand-step">
        <div
          v-if="showRoleStep"
          class="flex flex-col gap-2"
        >
          <label class="text-xs leading-4 text-color-secondary">
            What best describes your role?
            <span class="text-primary">*</span>
          </label>
          <BoxGridSelection
            v-model="role"
            :items="roleOptions"
          />
        </div>
      </Transition>

      <!-- Company Size -->
      <Transition name="expand-step">
        <div
          v-if="showCompanySizeStep"
          class="flex flex-col gap-2"
        >
          <label class="text-xs leading-4 text-color-secondary">
            How big is your company
            <span class="text-primary">*</span>
          </label>
          <BoxGridSelection
            v-model="companySize"
            :items="companySizeOptions"
          />
        </div>
      </Transition>
      <Transition name="expand-step">
        <div
          v-if="showCompanySizeStep"
          class="flex flex-col gap-2"
        >
          <label class="text-xs leading-4 text-color-secondary">
            Company Website
            <span class="text-primary">*</span>
          </label>
          <FieldText
            name="companyWebsite"
            label=""
            placeholder="https://yourcompany.com"
            class="w-full"
            required
          />
        </div>
      </Transition>

      <!-- Full Name -->
      <FieldText
        name="fullName"
        label="Your Full Name"
        placeholder="John Doe"
        class="w-full"
        :value="fullName"
        required
      />

      <!-- Terms Checkbox -->
      <div class="flex items-start gap-3">
        <Checkbox
          v-model="termsAccepted"
          :binary="true"
          inputId="onboarding-checkbox"
        />
        <label
          for="onboarding-checkbox"
          class="text-[13px] leading-5 font-medium text-color-secondary"
        >
          Schedule an onboarding session with an Azion expert
        </label>
      </div>
    </div>

    <!-- Empty state -->
    <div
      class="flex flex-col gap-2"
      v-else
    >
      <div
        v-for="item in 3"
        :key="item"
      >
        <div class="w-full mb-6">
          <Skeleton class="h-4 mb-4 w-2/3" />
          <Skeleton class="h-10 w-full" />
        </div>
      </div>
    </div>

    <!-- Plan Selection Drawer -->
    <PlanSelectionDrawer
      v-model:visible="showPlanDrawer"
      :plans="plansData"
      :currentPlan="plan"
      :billingCycle="billingCycle"
      @select="handlePlanSelect"
    />
  </form>
</template>

<script setup>
  import { ref, inject, computed, onMounted, watch } from 'vue'
  import { useField, useForm } from 'vee-validate'
  import * as yup from 'yup'
  import { useAccountStore } from '@/stores/account'
  import { usePlans } from '@/composables/usePlans'
  import { usePlansList } from '@/composables/usePlansService'
  import { useToast } from '@aziontech/webkit/use-toast'
  import BoxGridSelection from '@aziontech/webkit/box-grid-selection'
  import FieldText from '@aziontech/webkit/field-text'
  import Skeleton from '@aziontech/webkit/skeleton'
  import Checkbox from '@aziontech/webkit/checkbox'
  import PlanSelectorCard from './plan-selector-card.vue'
  import PlanSelectionDrawer from './plan-selection-drawer.vue'

  /** @type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const toast = useToast()
  const accountStore = useAccountStore()

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

  defineOptions({
    name: 'additional-data-form-block'
  })

  // Fetch plans from API
  const { data: plansData } = usePlansList()

  const isFormReady = computed(() => Boolean(plansData.value))

  const validationSchema = yup.object({
    plan: yup.string().required().oneOf(['hobby', 'pro']),
    usageIntent: yup.string().required('Usage intent is required'),
    role: yup.string().required('Role is required'),
    companySize: yup.string().when('usageIntent', {
      is: 'work',
      then: (schema) => schema.required('Company size is required'),
      otherwise: (schema) => schema.notRequired()
    }),
    companyWebsite: yup.string().when('usageIntent', {
      is: 'work',
      then: (schema) =>
        schema
          .trim()
          .required('Company website is required')
          .max(255, 'Company website must be less than 255 characters'),
      otherwise: (schema) => schema.notRequired()
    }),
    fullName: yup
      .string()
      .trim()
      .max(61, 'Your Full Name must be less than 61 characters')
      .matches(/[A-zÀ-ž.'-]+ [A-zÀ-ž.'-]+/, 'Your Full Name must include first and last name')
      .required('Your Full Name is required')
  })

  const { meta } = useForm({
    validationSchema
  })

  const { value: plan } = useField('plan')
  const { value: usageIntent } = useField('usageIntent')
  const { value: role } = useField('role')
  const { value: companySize } = useField('companySize')
  const { value: companyWebsite } = useField('companyWebsite')
  const { value: fullName } = useField('fullName')
  const { value: termsAccepted } = useField('termsAccepted')

  // Initialize plans from URL/storage
  const {
    plan: storedPlan,
    billingCycle: storedBillingCycle,
    initialize: initializePlans,
    setParam: setPlanParam
  } = usePlans()

  // Local billing cycle state
  const billingCycle = ref('yearly')

  // Plan drawer state
  const showPlanDrawer = ref(false)

  // Get selected plan data from API
  const selectedPlanData = computed(() => {
    if (!plansData.value?.length) return {}
    return (
      plansData.value.find(
        (planItem) => planItem.sku?.toLowerCase() === plan.value?.toLowerCase()
      ) || {}
    )
  })

  const usageIntentOptions = [
    { value: 'learn', description: 'Learn', ariaLabel: 'Learn usage intent' },
    {
      value: 'personal-project',
      description: 'Personal Project',
      ariaLabel: 'Personal project usage intent'
    },
    { value: 'work', description: 'Work', ariaLabel: 'Work usage intent' }
  ]

  const roleOptions = [
    {
      value: 'Software Developer',
      description: 'Software Developer',
      ariaLabel: 'Software Developer role'
    },
    { value: 'DevOps Engineer', description: 'DevOps Engineer', ariaLabel: 'DevOps Engineer role' },
    {
      value: 'Infrastructure Analyst',
      description: 'Infrastructure Analyst',
      ariaLabel: 'Infrastructure Analyst role'
    },
    {
      value: 'Network Engineer',
      description: 'Network Engineer',
      ariaLabel: 'Network Engineer role'
    },
    {
      value: 'Security Specialist',
      description: 'Security Specialist',
      ariaLabel: 'Security Specialist role'
    },
    { value: 'Data Engineer', description: 'Data Engineer', ariaLabel: 'Data Engineer role' },
    { value: 'AI/ML Engineer', description: 'AI/ML Engineer', ariaLabel: 'AI/ML Engineer role' },
    { value: 'IoT Engineer', description: 'IoT Engineer', ariaLabel: 'IoT Engineer role' },
    { value: 'Team Lead', description: 'Team Lead', ariaLabel: 'Team Lead role' },
    { value: 'Other', description: 'Other', ariaLabel: 'Other role' }
  ]

  // Company size options for BoxGridSelection
  const companySizeOptions = [
    {
      value: 'just-me',
      description: 'Just Me',
      ariaLabel: 'Just me company size'
    },
    {
      value: '2-100',
      description: '2 to 100 employees',
      ariaLabel: '2 to 100 employees company size'
    },
    {
      value: '101-500',
      description: '101 to 500 employees',
      ariaLabel: '101 to 500 employees company size'
    },
    {
      value: '501-1000',
      description: '501 to 1000 employees',
      ariaLabel: '501 to 1000 employees company size'
    },
    {
      value: '1001+',
      description: '1001+ employees',
      ariaLabel: '1001 or more employees company size'
    }
  ]

  const showRoleStep = computed(() => Boolean(usageIntent.value))
  const showCompanySizeStep = computed(
    () => Boolean(usageIntent.value) && Boolean(role.value) && usageIntent.value === 'work'
  )

  const additionalDataInfo = computed(() => [
    {
      id: 1,
      key: 'How are you planning to use Azion?',
      values: [
        { id: 1, value: 'Personal', other_values: false },
        { id: 2, value: 'Work', other_values: false },
        { id: 3, value: 'Study', other_values: false }
      ]
    },
    {
      id: 2,
      key: 'What best describes your role?',
      values: [
        { id: 4, value: 'Software Developer', other_values: false },
        { id: 5, value: 'DevOps Engineer', other_values: false },
        { id: 6, value: 'Infrastructure Analyst', other_values: false },
        { id: 7, value: 'Network Engineer', other_values: false },
        { id: 8, value: 'Security Specialist', other_values: false },
        { id: 9, value: 'Data Engineer', other_values: false },
        { id: 10, value: 'AI/ML Engineer', other_values: false },
        { id: 11, value: 'IoT Engineer', other_values: false },
        { id: 12, value: 'Team Lead', other_values: false },
        { id: 13, value: 'Other', other_values: true }
      ]
    },
    {
      id: 3,
      key: 'How big is your company?',
      values: [
        { id: 14, value: 'Just me', other_values: false },
        { id: 15, value: '2 to 100 employees', other_values: false },
        { id: 16, value: '101 to 500 employees', other_values: false },
        { id: 17, value: '501 to 1000 employees', other_values: false },
        { id: 18, value: '1001+ employees', other_values: false }
      ]
    },
    {
      id: 999,
      key: 'Your Full Name',
      values: []
    },
    {
      id: 4,
      key: 'Company Website?',
      values: [{ id: 19, value: '', other_values: true }]
    },
    {
      id: 5,
      key: 'Do you want to schedule an onboarding session with an Azion expert?',
      values: [
        { id: 20, value: 'Yes', other_values: false },
        { id: 21, value: 'No', other_values: false }
      ]
    }
  ])

  const usageIntentToApiValue = {
    learn: 'Study',
    'personal-project': 'Personal',
    work: 'Work'
  }

  const companySizeToApiValue = {
    'just-me': 'Just me',
    '2-100': '2 to 100 employees',
    '101-500': '101 to 500 employees',
    '501-1000': '501 to 1000 employees',
    '1001+': '1001+ employees'
  }
  // Map jobRole from kebab-case to title case
  const jobRoleKebabToTitle = (kebabRole) => {
    const roleMap = {
      'software-developer': 'Software Developer',
      'devops-engineer': 'DevOps Engineer',
      'infrastructure-analyst': 'Infrastructure Analyst',
      'network-engineer': 'Network Engineer',
      'security-specialist': 'Security Specialist',
      'data-engineer': 'Data Engineer',
      'ai-ml-engineer': 'AI/ML Engineer',
      'iot-engineer': 'IoT Engineer',
      'team-lead': 'Team Lead',
      other: 'Other'
    }
    return roleMap[kebabRole] || null
  }

  // Open plan selection drawer
  const openPlanDrawer = () => {
    showPlanDrawer.value = true
  }

  // Handle plan selection from drawer
  const handlePlanSelect = ({ plan: selectedPlan, billingCycle: selectedBillingCycle }) => {
    plan.value = selectedPlan
    billingCycle.value = selectedBillingCycle
    setPlanParam('plan', selectedPlan)
    setPlanParam('billingCycle', selectedBillingCycle)
  }

  // Pre-fill form fields on mount
  onMounted(() => {
    initializePlans()

    // Pre-fill plan from URL params/storage
    if (storedPlan.value && ['hobby', 'pro'].includes(storedPlan.value)) {
      plan.value = storedPlan.value
    }

    // Pre-fill billing cycle
    if (storedBillingCycle.value) {
      billingCycle.value = storedBillingCycle.value
    }

    // Pre-fill role from accountStore
    const jobRole = accountStore.account?.jobRole
    if (jobRole) {
      const roleTitle = jobRoleKebabToTitle(jobRole)
      if (roleTitle) {
        role.value = roleTitle
      }
    }
  })

  watch(
    () => [
      accountStore.accountData?.first_name ?? accountStore.accountData?.firstName,
      accountStore.accountData?.last_name ?? accountStore.accountData?.lastName
    ],
    ([firstName, lastName]) => {
      if (!fullName.value && (firstName || lastName)) {
        fullName.value = `${firstName || ''} ${lastName || ''}`.trim()
      }
    },
    { immediate: true }
  )

  watch(plan, (selectedPlan) => {
    if (selectedPlan === undefined) return
    setPlanParam('plan', selectedPlan ?? null)
  })

  watch(usageIntent, (selectedUsageIntent) => {
    if (selectedUsageIntent !== 'work') {
      companySize.value = undefined
      companyWebsite.value = undefined
    }
  })

  const loading = ref(false)

  const submitForm = async () => {
    loading.value = true

    try {
      const usersPayload = fullName.value
      const accountPayload = role.value
      const userId = accountStore.userId
      const additionalDataPayload = {
        id: userId,
        use: usageIntentToApiValue[usageIntent.value],
        role: role.value,
        inputRole: undefined,
        companySize: companySizeToApiValue[companySize.value],
        onboardingSession: termsAccepted.value,
        companyWebsite: companyWebsite.value,
        plan: plan.value,
        fullName: fullName.value
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

      // tracker.signUp
      //   .submittedAdditionalData({
      //     plan: plan.value,
      //     role: role.value,
      //     fullName: fullName.value
      //   })
      //   .track()
      emit('proceedToCheckout')
    } catch (err) {
      const errorMessage = err?.message || err
      const errors = typeof errorMessage === 'string' ? { errorMessage } : errorMessage
      toast.add({
        severity: 'error',
        detail: errors.errorMessage || 'Error submitting form',
        summary: 'Error'
      })
      tracker.signUp.failedSubmitAdditionalData(errors).track()
    } finally {
      loading.value = false
    }
  }

  const emit = defineEmits(['proceedToCheckout'])

  defineExpose({
    submitForm,
    loading,
    meta,
    plan
  })
</script>

<style scoped>
  .expand-step-enter-active,
  .expand-step-leave-active {
    transition:
      opacity 200ms ease,
      max-height 260ms ease;
    overflow: hidden;
  }

  .expand-step-enter-from,
  .expand-step-leave-to {
    opacity: 0;
    max-height: 0;
  }

  .expand-step-enter-to,
  .expand-step-leave-from {
    opacity: 1;
    max-height: 560px;
  }
</style>
