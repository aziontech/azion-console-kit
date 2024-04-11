<template>
  <div
    class="flex flex-col gap-6 animate-slideDown overflow-hidden"
    v-if="showForm"
  >
    <div class="flex flex-col gap-2">
      <label
        for="email"
        class="font-semibold text-sm"
      >
        Work Email *
      </label>
      <InputText
        v-model="email"
        autocomplete="off"
        id="email"
        type="email"
        class="w-full"
        :class="{ 'p-invalid': errors.email }"
      />
      <small
        v-if="errors.email"
        class="p-error text-xs font-normal leading-tight"
        >{{ errors.email }}</small
      >
    </div>

    <div class="flex flex-col gap-2">
      <label
        for="password"
        class="font-semibold text-sm"
      >
        Password *
      </label>
      <Password
        class="col-span-1 min-w-full"
        :class="{ 'p-invalid': errors.password }"
        toggleMask
        v-model="password"
        promptLabel="Choose a password"
        weakLabel="Weak"
        autocomplete="off"
        mediumLabel="Medium"
        strongLabel="Strong"
        required
        :pt="{
          meter: 'rounded-md',
          meterLabel: 'text-sm'
        }"
      >
        <template #header> </template>
        <template #footer>
          <div class="mt-4 text-sm space-y-4">
            <PrimeDivider />
            <p class="font-medium">Must have at least:</p>
          </div>

          <div class="text-sm p-4 py-0 mt-2">
            <ul class="list-square font-normal space-y-2 text-color-secondary">
              <li
                v-for="requirement in passwordRequirementsList"
                :key="requirement.text"
              >
                <span>{{ requirement.text }}</span>
              </li>
            </ul>
          </div>
        </template>
      </Password>

      <small
        v-if="errors.password"
        class="p-error text-xs font-normal leading-tight"
        >{{ errors.password }}</small
      >
    </div>
  </div>

  <PrimeButton
    class="animate-fadeIn"
    :label="labelButton"
    :loading="loading"
    @click="eventButtonSignUp"
  />
</template>

<script setup>
  import PrimeButton from 'primevue/button'
  import Password from 'primevue/password'
  import InputText from 'primevue/inputtext'
  import PrimeDivider from 'primevue/divider'

  import { useToast } from 'primevue/usetoast'
  import { getInstance, load } from 'recaptcha-v3'
  import { useField, useForm } from 'vee-validate'
  import { useAccountStore } from '@/stores/account'

  import { inject, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import * as yup from 'yup'
  /** @type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const emit = defineEmits(['loginWithEmail'])

  const props = defineProps({
    signupService: { required: true, type: Function },
    showLoginFromEmail: { required: true, type: Boolean }
  })

  let recaptcha

  onMounted(async () => {
    recaptcha = await load(import.meta.env.VITE_RECAPTCHA_SITE_KEY)
    getInstance().showBadge()
  })

  const passwordRequirementsList = ref([
    { text: '8 characters', valid: false },
    { text: '1 uppercase letter', valid: false },
    { text: '1 lowercase letter', valid: false },
    { text: '1 number', valid: false },
    { text: '1 special character', valid: false }
  ])

  const validationSchema = yup.object({
    email: yup
      .string()
      .max(254, 'Exceeded number of characters.')
      .email('Enter a valid email.')
      .required('Email is a required field.'),
    password: yup
      .string()
      .required('Password is a required field.')
      .test('max', 'Exceeded number of characters.', (value) => value?.length <= 128)
      .test('noSpaces', 'Spaces not allowed.', (value) => !value?.match(/\s/g))
      .test('requirements', 'Password does not meet requirements.', (value) => {
        const hasUpperCase = value && /[A-Z]/.test(value)
        const hasLowerCase = value && /[a-z]/.test(value)
        const hasSpecialChar = value && /[!@#$%^&*(),.?":{}|<>]/.test(value)
        const hasMinLength = value?.length > 7
        const hasNumber = value && /[0-9]/.test(value)

        passwordRequirementsList.value[0].valid = hasMinLength
        passwordRequirementsList.value[1].valid = hasUpperCase
        passwordRequirementsList.value[2].valid = hasLowerCase
        passwordRequirementsList.value[3].valid = hasNumber
        passwordRequirementsList.value[4].valid = hasSpecialChar

        return hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar
      })
  })

  const { errors, handleSubmit } = useForm({ validationSchema })

  const { value: password } = useField('password')
  const { value: email } = useField('email')

  const toast = useToast()
  const router = useRouter()
  const loading = ref(false)
  const showForm = ref(false)

  const labelButton = ref('Sign Up with Work Email')

  const encodeEmail = (email) => {
    return encodeURIComponent(email)
  }

  const eventButtonSignUp = () => {
    if (showForm.value) {
      signUp()
    } else {
      handleSignUpEmailClick()
    }
  }

  const extractNameFromEmail = (email) => {
    const [emailBeforeAt] = email.split('@')
    return emailBeforeAt
  }

  const signUp = handleSubmit(async (values) => {
    loading.value = true
    try {
      const name = extractNameFromEmail(values.email)
      const captcha = await recaptcha.execute('signup')
      await props.signupService({ ...values, name, captcha })

      tracker.signUp.userSignedUp({ method: 'email' })
      router.push({ query: { email: encodeEmail(values.email) } })
      loading.value = false
      emit('loginWithEmail')
    } catch (err) {
      const { message = '', fieldName = '' } = JSON.parse(err)
      tracker.signUp
        .userFailedSignUp({
          errorType: 'api',
          fieldName: fieldName,
          errorMessage: message
        })
        .track()
      loading.value = false
      toast.add({ life: 5000, severity: 'error', detail: message, summary: 'Error' })
    }
  })

  const handleSignUpEmailClick = () => {
    const accountStore = useAccountStore()
    accountStore.resetSsoSignUpMethod()
    showForm.value = true
    labelButton.value = 'Sign Up'
  }

  onUnmounted(() => {
    getInstance()?.hideBadge()
  })

  watch(
    () => props.showLoginFromEmail,
    (value) => {
      if (!value) {
        showForm.value = !value
        labelButton.value = 'Sign Up'
      }
    }
  )
</script>
