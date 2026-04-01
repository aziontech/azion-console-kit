<template>
  <form
    class="w-full flex flex-col"
    @submit.prevent="submitForm"
  >
    <div
      class="flex flex-col gap-6"
      v-if="additionalDataInfo?.length"
    >
      <!-- Plan Selector -->
      <div class="flex flex-col gap-2">
        <BoxGridSelection
          v-model="plan"
          :items="planOptions"
        >
          <template #tag="{ item }">
            <div
              class="flex items-center rounded-[6px] border px-[10px] py-1 surface-section surface-border w-fit"
            >
              <span class="font-proto-mono text-[10px] font-semibold leading-4 text-color">
                {{ item.tagLabel }}
              </span>
            </div>
          </template>
        </BoxGridSelection>
      </div>

      <!-- Full Name -->
      <div class="flex flex-col gap-2">
        <label class="flex gap-1 items-center text-sm font-semibold text-[var(--text-color)]">
          Your Full Name
          <span class="text-[var(--badge-tag-primary-border)]">*</span>
          <span class="text-[10px] text-[var(--text-color-secondary)] font-normal">(Required)</span>
        </label>
        <PrimeInputText
          v-model="fullName"
          name="fullName"
          id="fullName"
          placeholder="John Doe"
          class="w-full"
        />
        <small
          v-if="errors.fullName"
          class="p-error text-xs font-normal leading-tight"
        >
          {{ errors.fullName }}
        </small>
      </div>

      <!-- Role Dropdown -->
      <div class="relative z-10">
        <FieldDropdown
          name="role"
          :value="role"
          :options="roleOptions"
          optionLabel="title"
          optionValue="inputValue"
          placeholder="Choose an option that describes your role"
          label="What best describes your role?"
        />
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
          <PrimeSkeleton class="h-4 mb-4 w-2/3" />
          <PrimeSkeleton class="h-10 w-full" />
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
  import { ref, inject, computed, onMounted, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAccountStore } from '@/stores/account'
  import { usePlans } from '@/composables/usePlans'
  import BoxGridSelection from '@aziontech/webkit/box-grid-selection'
  import * as yup from 'yup'
  import FieldDropdown from '@aziontech/webkit/field-dropdown'

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

  const additionalDataInfo = ref([
    {
      id: 1,
      key: 'How are you planning to use Azion?',
      required: true,
      show: true,
      values: [
        { id: 1, value: 'hobby', other_values: false },
        { id: 2, value: 'pro', other_values: false },
        { id: 3, value: 'scale', other_values: false }
      ]
    },
    {
      id: 2,
      key: 'What best describes your role?',
      required: true,
      show: true,
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
        { id: 13, value: 'Other', other_values: false }
      ]
    },
    {
      id: 999,
      key: 'Your Full Name',
      required: true,
      show: true
    }
  ])

  const validationSchema = yup.object({
    plan: yup.string().required().oneOf(['hobby', 'pro', 'scale']),
    role: yup.string().required('Role is required'),
    fullName: yup
      .string()
      .trim()
      .max(61, 'Your Full Name must be less than 61 characters')
      .matches(/[A-zÀ-ž.'-]+ [A-zÀ-ž.'-]+/, 'Your Full Name must include first and last name')
      .required('Your Full Name is required')
  })

  const { meta, errors } = useForm({
    validationSchema
  })

  const { value: plan } = useField('plan')
  const { value: role } = useField('role')
  const { value: fullName } = useField('fullName')

  // Initialize plans from URL/storage
  const { plan: storedPlan, initialize: initializePlans, setParam: setPlanParam } = usePlans()

  // Plan options for the selector
  const planOptions = [
    {
      value: 'hobby',
      icon: 'ai ai-instructor',
      description: 'For learning and small personal projects.',
      tagLabel: 'Hobby Plan',
      ariaLabel: 'Hobby Plan - For learning and small personal projects.'
    },
    {
      value: 'pro',
      icon: 'pi pi-chart-line',
      description: 'For professional or commercial applications.',
      tagLabel: 'Pro Plan',
      ariaLabel: 'Pro Plan - For professional or commercial applications.'
    },
    {
      value: 'scale',
      icon: 'pi pi-file-check',
      description: 'For businesses requiring advanced security and compliance.',
      tagLabel: 'Scale Plan',
      ariaLabel: 'Scale Plan - For businesses requiring advanced security and compliance.'
    }
  ]

  // Role options for dropdown
  const roleOptions = computed(() => {
    const roleData = additionalDataInfo.value[1]?.values || []
    return roleData.map((option) => ({
      title: option.value,
      inputValue: option.value
    }))
  })

  // Pre-select plan from URL params on mount
  onMounted(() => {
    initializePlans()
    if (storedPlan.value && ['hobby', 'pro', 'scale'].includes(storedPlan.value)) {
      plan.value = storedPlan.value
    }
  })

  watch(plan, (selectedPlan) => {
    if (selectedPlan === undefined) return
    setPlanParam('plan', selectedPlan ?? null)
  })

  const loading = ref(false)

  const submitForm = async () => {
    loading.value = true

    try {
      const usersPayload = fullName.value
      const accountPayload = role.value
      const additionalDataPayload = {
        plan: plan.value,
        role: role.value,
        fullName: fullName.value,
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

      tracker.signUp
        .submittedAdditionalData({
          plan: plan.value,
          role: role.value,
          fullName: fullName.value
        })
        .track()
    } catch (err) {
      const errors = JSON.parse(err)
      toast.add({ severity: 'error', detail: errors.errorMessage, summary: 'Error' })
      tracker.signUp.failedSubmitAdditionalData(errors).track()
    } finally {
      router.push({ name: 'home' })
      loading.value = false
    }
  }

  defineExpose({
    submitForm,
    loading,
    meta,
    plan
  })
</script>
