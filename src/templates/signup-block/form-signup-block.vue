<template>
  <div class="w-full flex flex-col gap-8 animate-fadeIn">
    <form
      class="flex flex-col gap-8"
      @submit.prevent
    >
      <div
        v-if="showEmailForm"
        class="flex flex-col gap-8"
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
            for="email"
            class="font-semibold text-sm"
          >
            Password *
          </label>
          <Password
            inputId="password"
            v-model="password"
            toggleMask
          >
            <template #footer>
              <Divider />
              <p class="mt-2">Must have at least:</p>
              <ul
                class="pl-2 ml-2 mt-0"
                style="line-height: 1.5"
              >
                <li
                  v-for="(requirement, i) in passwordRequirementsList"
                  class="flex gap-3 items-center text-color-secondary"
                  :key="i"
                >
                  <span>{{ requirement }}</span>
                </li>
              </ul>
            </template>
          </Password>
        </div>
      </div>

      <PrimeButton
        label="Sign Up with Work Email"
        v-if="!showEmailForm"
        @click="handleSignUpEmailClick"
      />
      <PrimeButton
        v-if="showEmailForm"
        label="Sign Up"
        @click="showEmailForm = false"
      />
    </form>

    <p class="text-sm font-normal text-center text-color-secondary">
      By signing up, you agree to the
      <PrimeButton
        label="Terms of Service"
        link
        class="p-0 text-sm"
        @click="azionTermsAndServicesWindowOpener"
      />
      and
      <PrimeButton
        label="Privacy Policy."
        link
        class="p-0 text-sm"
        @click="azionPrivacyPolicyWindowOpener"
      />
    </p>
  </div>
</template>

<script setup>
  import { azionPrivacyPolicyWindowOpener, azionTermsAndServicesWindowOpener } from '@/helpers'

  import PrimeButton from 'primevue/button'
  import Divider from 'primevue/divider'
  import Password from 'primevue/password'
  import InputText from 'primevue/inputtext'
  import { useAccountStore } from '@/stores/account'

  import { useToast } from 'primevue/usetoast'
  import { getInstance, load } from 'recaptcha-v3'
  import { useField, useForm } from 'vee-validate'
  import { inject, onMounted, onUnmounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import * as yup from 'yup'
  /** @type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineEmits(['change-signup-method'])

  const props = defineProps({
    signupService: { required: true, type: Function }
  })

  let recaptcha

  const showEmailForm = ref(false)

  const handleSignUpEmailClick = () => {
    const accountStore = useAccountStore()
    showEmailForm.value = true
    accountStore.resetSsoSignUpMethod()
  }

  onMounted(async () => {
    recaptcha = await load(import.meta.env.VITE_RECAPTCHA_SITE_KEY)
    getInstance().showBadge()
  })

  const passwordRequirementsList = ref([
    '8 characters',
    '1 uppercase letter',
    '1 lowercase letter',
    '1 special character (Example: !?<>@#$%)'
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
      .test('requirements', '', (value) => {
        const hasUpperCase = value && /[A-Z]/.test(value)
        const hasLowerCase = value && /[a-z]/.test(value)
        const hasSpecialChar = value && /[!@#$%^&*(),.?":{}|<>]/.test(value)
        const hasMinLength = value?.length > 7
        passwordRequirementsList.value[0].valid = hasMinLength
        passwordRequirementsList.value[1].valid = hasUpperCase
        passwordRequirementsList.value[2].valid = hasLowerCase
        passwordRequirementsList.value[3].valid = hasSpecialChar
        return hasMinLength && hasUpperCase && hasLowerCase && hasSpecialChar
      })
  })

  const { values, meta, errors } = useForm({ validationSchema })

  const { value: password } = useField('password')
  const { value: email } = useField('email')

  const toast = useToast()
  const router = useRouter()

  const loading = ref(false)

  const encodeEmail = (email) => {
    return encodeURIComponent(email)
  }

  const signUp = async () => {
    loading.value = true
    try {
      const captcha = await recaptcha.execute('signup')
      await props.signupService({ ...values, captcha })

      tracker.signUp.userSignedUp({ method: 'email' })
      router.push({ name: 'activation', query: { email: encodeEmail(values.email) } })
    } catch (err) {
      const { message, fieldName } = JSON.parse(err)
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
  }

  onUnmounted(() => {
    getInstance()?.hideBadge()
  })
</script>
